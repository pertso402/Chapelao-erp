import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.generated";

export type Fatura = Tables<"company_invoices">;
export type ItemFatura = Tables<"company_invoice_items">;

export async function listarFaturas(companyId: string): Promise<Fatura[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_invoices")
    .select("*")
    .eq("company_id", companyId)
    .order("periodo_inicio", { ascending: false });
  return data ?? [];
}

export async function getFatura(id: string): Promise<Fatura | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("company_invoices").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

// Demonstrativo: itens agrupados por funcionário.
export async function demonstrativo(invoiceId: string): Promise<{
  porFuncionario: { nome: string; itens: ItemFatura[]; total: number }[];
  recebivel: Tables<"receivables"> | null;
}> {
  const supabase = await createClient();
  const [{ data: itens }, { data: recv }] = await Promise.all([
    supabase.from("company_invoice_items").select("*").eq("invoice_id", invoiceId).order("data_pedido"),
    supabase.from("receivables").select("*").eq("company_invoice_id", invoiceId).maybeSingle(),
  ]);

  const grupos = new Map<string, { nome: string; itens: ItemFatura[]; total: number }>();
  for (const it of itens ?? []) {
    const nome = it.employee_nome ?? "Sem funcionário";
    const g = grupos.get(nome) ?? { nome, itens: [], total: 0 };
    g.itens.push(it);
    g.total += Number(it.valor);
    grupos.set(nome, g);
  }

  return {
    porFuncionario: [...grupos.values()].sort((a, b) => a.nome.localeCompare(b.nome)),
    recebivel: recv ?? null,
  };
}

// Quantos pedidos elegíveis (não faturados) há no mês corrente para a empresa.
export async function pedidosElegiveisDoMes(companyId: string): Promise<number> {
  const supabase = await createClient();
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("pedidos")
    .select("id, status")
    .eq("company_id", companyId)
    .is("company_invoice_id", null)
    .gte("created_at", inicio.toISOString());

  return (data ?? []).filter((p) => !(p.status && /cancel/i.test(p.status))).length;
}
