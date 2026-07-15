"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

export type ItemCompra = {
  inventory_item_id: string;
  nome: string;
  quantidade: number;
  custo_unitario: number;
};

// Confirma uma compra: cria a compra, dá ENTRADA no estoque de cada item,
// atualiza o custo do item e gera a CONTA A PAGAR do total.
export async function confirmarCompra(input: {
  supplier_id: string;
  vencimento?: string | null;
  observacao?: string;
  itens: ItemCompra[];
}) {
  const user = await requirePermission("purchasing.manage");
  const supabase = await createClient();

  const itens = (input.itens ?? []).filter((i) => i.quantidade > 0);
  if (!input.supplier_id) return { ok: false as const, erro: "Selecione o fornecedor." };
  if (itens.length === 0) return { ok: false as const, erro: "Adicione ao menos um item." };

  const total = Number(itens.reduce((s, i) => s + i.quantidade * i.custo_unitario, 0).toFixed(2));

  const { data: fornecedor } = await supabase.from("suppliers").select("nome").eq("id", input.supplier_id).maybeSingle();

  // 1) cria a compra
  const { data: compra, error: cErr } = await supabase
    .from("purchases")
    .insert({
      supplier_id: input.supplier_id,
      unit_id: user.profile?.unit_id ?? null,
      status: "confirmada",
      total,
      observacao: input.observacao?.trim() || null,
      created_by: user.id,
      confirmada_em: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (cErr) return { ok: false as const, erro: cErr.message };

  // 2) itens da compra
  await supabase.from("purchase_items").insert(
    itens.map((i) => ({
      purchase_id: compra.id,
      inventory_item_id: i.inventory_item_id,
      quantidade: i.quantidade,
      custo_unitario: i.custo_unitario,
      total: Number((i.quantidade * i.custo_unitario).toFixed(2)),
    })),
  );

  // 3) entrada no estoque + atualiza custo do item (último custo)
  for (const i of itens) {
    await supabase.from("stock_movements").insert({
      item_id: i.inventory_item_id,
      tipo: "entrada",
      quantidade: i.quantidade,
      custo_unitario: i.custo_unitario,
      motivo: `Compra — ${fornecedor?.nome ?? "fornecedor"}`,
      created_by: user.id,
    });
    await supabase.from("inventory_items").update({ custo_atual: i.custo_unitario }).eq("id", i.inventory_item_id);
  }

  // 4) conta a pagar
  await supabase.from("payables").insert({
    supplier_id: input.supplier_id,
    purchase_id: compra.id,
    unit_id: user.profile?.unit_id ?? null,
    descricao: `Compra — ${fornecedor?.nome ?? "fornecedor"}`,
    valor: total,
    vencimento: input.vencimento || null,
    status: "pendente",
  });

  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: user.profile?.unit_id ?? null,
    acao: "compra.confirmada",
    entidade: "purchases",
    entidade_id: compra.id,
    valores_posteriores: { total, itens: itens.length },
    origem: "erp",
  });

  revalidatePath("/compras");
  revalidatePath("/estoque");
  revalidatePath("/financeiro");
  return { ok: true as const, id: compra.id, total };
}

export async function pagarPayable(payableId: string) {
  const user = await requirePermission("purchasing.manage");
  const supabase = await createClient();
  const { data: pay } = await supabase.from("payables").select("valor").eq("id", payableId).maybeSingle();
  if (!pay) return { ok: false as const, erro: "Conta não encontrada." };

  await supabase.from("payables").update({ status: "pago", pago_em: new Date().toISOString(), pago_por: user.id }).eq("id", payableId);
  await supabase.from("audit_events").insert({
    user_id: user.id, acao: "conta_pagar.baixa", entidade: "payables", entidade_id: payableId,
    valores_posteriores: { valor: pay.valor }, origem: "erp",
  });
  revalidatePath("/financeiro");
  return { ok: true as const };
}
