"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

// Fecha a fatura do mês corrente da empresa: congela os pedidos elegíveis,
// gera o demonstrativo e cria a conta a receber. Impede faturar pedido duas vezes.
export async function fecharFaturaMes(companyId: string) {
  const user = await requirePermission("b2b.manage");
  const supabase = await createClient();

  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimExcl = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

  const { data: empresa } = await supabase
    .from("companies")
    .select("id, unit_id, razao_social, nome_fantasia, dia_vencimento")
    .eq("id", companyId)
    .maybeSingle();
  if (!empresa) return { ok: false as const, erro: "Empresa não encontrada." };

  type Ped = {
    id: string; numero_pedido: number; total: number | null; subtotal: number | null;
    desconto: number | null; created_at: string | null; company_employee_id: string | null; status: string | null;
    itens_pedido: { nome_produto: string; quantidade: number }[] | null;
  };
  const { data: pedidosRaw } = await supabase
    .from("pedidos")
    .select("id, numero_pedido, total, subtotal, desconto, created_at, company_employee_id, status, itens_pedido(nome_produto, quantidade)")
    .eq("company_id", companyId)
    .is("company_invoice_id", null)
    .gte("created_at", inicio.toISOString())
    .lt("created_at", fimExcl.toISOString());

  const pedidos = ((pedidosRaw ?? []) as unknown as Ped[]).filter(
    (p) => !(p.status && /cancel/i.test(p.status)),
  );
  if (pedidos.length === 0) return { ok: false as const, erro: "Não há pedidos a faturar neste mês." };

  const { data: emps } = await supabase
    .from("company_employees")
    .select("id, nome")
    .eq("company_id", companyId);
  const nomeFunc = new Map((emps ?? []).map((e) => [e.id, e.nome]));

  const subtotal = pedidos.reduce((s, p) => s + Number(p.subtotal ?? 0), 0);
  const desconto = pedidos.reduce((s, p) => s + Number(p.desconto ?? 0), 0);
  const total = pedidos.reduce((s, p) => s + Number(p.total ?? 0), 0);

  // 1) cria a fatura
  const { data: fatura, error: fErr } = await supabase
    .from("company_invoices")
    .insert({
      company_id: companyId,
      unit_id: empresa.unit_id,
      periodo_inicio: inicio.toISOString().slice(0, 10),
      periodo_fim: new Date(fimExcl.getTime() - 864e5).toISOString().slice(0, 10),
      status: "fechada",
      subtotal: Number(subtotal.toFixed(2)),
      desconto: Number(desconto.toFixed(2)),
      total: Number(total.toFixed(2)),
      itens_count: pedidos.length,
      fechada_por: user.id,
    })
    .select("id")
    .single();
  if (fErr) return { ok: false as const, erro: fErr.message };

  // 2) itens congelados (um por pedido)
  const itens = pedidos.map((p) => ({
    invoice_id: fatura.id,
    pedido_id: p.id,
    company_employee_id: p.company_employee_id,
    employee_nome: p.company_employee_id ? nomeFunc.get(p.company_employee_id) ?? null : null,
    numero_pedido: p.numero_pedido,
    data_pedido: p.created_at,
    descricao: (p.itens_pedido ?? []).map((i) => `${i.quantidade}× ${i.nome_produto}`).join(", ") || "Consumo",
    valor: Number(p.total ?? 0),
  }));
  await supabase.from("company_invoice_items").insert(itens);

  // 3) marca os pedidos como faturados (impede refaturar)
  await supabase.from("pedidos").update({ company_invoice_id: fatura.id }).in("id", pedidos.map((p) => p.id));

  // 4) cria a conta a receber
  const venc = empresa.dia_vencimento
    ? new Date(agora.getFullYear(), agora.getMonth() + 1, empresa.dia_vencimento).toISOString().slice(0, 10)
    : null;
  await supabase.from("receivables").insert({
    company_id: companyId,
    company_invoice_id: fatura.id,
    unit_id: empresa.unit_id,
    descricao: `Fatura ${empresa.nome_fantasia || empresa.razao_social} — ${inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
    valor: Number(total.toFixed(2)),
    vencimento: venc,
    status: "pendente",
  });

  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: empresa.unit_id,
    acao: "b2b.fatura_fechada",
    entidade: "company_invoices",
    entidade_id: fatura.id,
    valores_posteriores: { total, pedidos: pedidos.length },
    origem: "erp",
  });

  revalidatePath(`/empresas/${companyId}`);
  return { ok: true as const, invoiceId: fatura.id, total: Number(total.toFixed(2)), pedidos: pedidos.length };
}

// Dá baixa em uma conta a receber (recebimento).
export async function receberRecebivel(recebivelId: string) {
  const user = await requirePermission("b2b.manage");
  const supabase = await createClient();

  const { data: recv } = await supabase
    .from("receivables")
    .select("id, company_invoice_id, valor")
    .eq("id", recebivelId)
    .maybeSingle();
  if (!recv) return { ok: false as const, erro: "Recebível não encontrado." };

  await supabase
    .from("receivables")
    .update({ status: "pago", pago_em: new Date().toISOString(), recebido_por: user.id })
    .eq("id", recebivelId);

  if (recv.company_invoice_id) {
    await supabase.from("company_invoices").update({ status: "paga" }).eq("id", recv.company_invoice_id);
  }

  await supabase.from("audit_events").insert({
    user_id: user.id,
    acao: "b2b.recebimento",
    entidade: "receivables",
    entidade_id: recebivelId,
    valores_posteriores: { valor: recv.valor },
    origem: "erp",
  });

  revalidatePath("/financeiro");
  return { ok: true as const };
}
