"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

export async function abrirMesa(numeroMesa: number) {
  const user = await requirePermission("pdv.use");
  const n = Number(numeroMesa);
  if (!n || n <= 0) return { ok: false as const, erro: "Número de mesa inválido." };
  const supabase = await createClient();

  const { data: existente } = await supabase
    .from("comandas").select("id").eq("numero_mesa", n).eq("status", "aberta").maybeSingle();
  if (existente) return { ok: true as const, id: existente.id, jaExistia: true };

  const { data, error } = await supabase
    .from("comandas")
    .insert({ numero_mesa: n, status: "aberta", aberta_por: user.id, unit_id: user.profile?.unit_id ?? null })
    .select("id")
    .single();
  if (error) return { ok: false as const, erro: error.message };

  revalidatePath("/mesas");
  return { ok: true as const, id: data.id, jaExistia: false };
}

export async function adicionarItemComanda(input: {
  comanda_id: string;
  produto_id: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  composicao?: string;
  opcoes?: { option_id: string; nome: string; preco: number }[];
}) {
  const user = await requirePermission("pdv.use");
  const supabase = await createClient();
  const qtd = Number(input.quantidade) || 1;
  const total = Number((qtd * Number(input.preco_unitario)).toFixed(2));

  const { error } = await supabase.from("comanda_itens").insert({
    comanda_id: input.comanda_id,
    produto_id: input.produto_id,
    nome_produto: input.nome_produto,
    quantidade: qtd,
    preco_unitario: input.preco_unitario,
    total,
    composicao: input.composicao ?? null,
    opcoes: input.opcoes ?? [],
    created_by: user.id,
  });
  if (error) return { ok: false as const, erro: error.message };

  revalidatePath(`/mesas/${input.comanda_id}`);
  revalidatePath("/mesas");
  return { ok: true as const };
}

export async function removerItemComanda(itemId: string, comandaId: string) {
  await requirePermission("pdv.use");
  const supabase = await createClient();
  const { error } = await supabase.from("comanda_itens").delete().eq("id", itemId);
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath(`/mesas/${comandaId}`);
  revalidatePath("/mesas");
  return { ok: true as const };
}

export async function cancelarComanda(comandaId: string) {
  const user = await requirePermission("pdv.use");
  const supabase = await createClient();
  const { error } = await supabase
    .from("comandas")
    .update({ status: "cancelada", fechada_em: new Date().toISOString() })
    .eq("id", comandaId);
  if (error) return { ok: false as const, erro: error.message };

  await supabase.from("audit_events").insert({
    user_id: user.id, acao: "mesa.cancelada", entidade: "comandas", entidade_id: comandaId, origem: "erp",
  });
  revalidatePath("/mesas");
  return { ok: true as const };
}

// Usado pelo PDV: busca a comanda aberta de uma mesa para importar os itens.
export async function buscarComandaPorMesa(numeroMesa: number) {
  await requirePermission("pdv.use");
  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("id, numero_mesa, comanda_itens(id, produto_id, nome_produto, quantidade, preco_unitario, total, composicao, opcoes)")
    .eq("numero_mesa", Number(numeroMesa))
    .eq("status", "aberta")
    .maybeSingle();

  if (!data) return { ok: false as const, erro: `Nenhuma mesa ${numeroMesa} aberta.` };
  const d = data as unknown as {
    id: string; numero_mesa: number;
    comanda_itens: { id: string; produto_id: string | null; nome_produto: string; quantidade: number; preco_unitario: number; total: number; composicao: string | null; opcoes: unknown }[] | null;
  };
  const itens = (d.comanda_itens ?? []).map((i) => ({
    produto_id: i.produto_id ?? "",
    nome: i.nome_produto,
    quantidade: Number(i.quantidade),
    preco_unitario: Number(i.preco_unitario),
    composicao: i.composicao ?? undefined,
    opcoes: (i.opcoes as { option_id: string; nome: string; preco: number }[]) ?? [],
  }));
  if (itens.length === 0) return { ok: false as const, erro: `Mesa ${numeroMesa} está aberta mas sem itens.` };

  return { ok: true as const, comanda_id: d.id, numero_mesa: d.numero_mesa, itens };
}
