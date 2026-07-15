import { createClient } from "@/lib/supabase/server";

export type ItemEstoque = {
  id: string;
  nome: string;
  categoria: string | null;
  sigla: string;
  saldo: number;
  estoque_minimo: number;
  custo_atual: number;
  abaixoMinimo: boolean;
};

export async function listarEstoque(): Promise<ItemEstoque[]> {
  const supabase = await createClient();
  const [{ data: itens }, { data: saldos }, { data: medidas }] = await Promise.all([
    supabase.from("inventory_items").select("*").eq("ativo", true).order("categoria").order("nome"),
    supabase.from("v_inventory_balance").select("item_id, saldo"),
    supabase.from("measurement_units").select("id, sigla"),
  ]);

  const saldoPorItem = new Map((saldos ?? []).map((s) => [s.item_id, Number(s.saldo)]));
  const siglaPorId = new Map((medidas ?? []).map((m) => [m.id, m.sigla]));

  return (itens ?? []).map((i) => {
    const saldo = saldoPorItem.get(i.id) ?? 0;
    return {
      id: i.id,
      nome: i.nome,
      categoria: i.categoria,
      sigla: i.measure_id ? siglaPorId.get(i.measure_id) ?? "" : "",
      saldo,
      estoque_minimo: Number(i.estoque_minimo),
      custo_atual: Number(i.custo_atual),
      abaixoMinimo: saldo < Number(i.estoque_minimo),
    };
  });
}

export async function resumoEstoque(): Promise<{ itens: number; abaixoMinimo: number; valorEstoque: number }> {
  const itens = await listarEstoque();
  return {
    itens: itens.length,
    abaixoMinimo: itens.filter((i) => i.abaixoMinimo).length,
    valorEstoque: itens.reduce((s, i) => s + Math.max(0, i.saldo) * i.custo_atual, 0),
  };
}

export type ItemComHistorico = {
  item: { id: string; nome: string; sigla: string; estoque_minimo: number; custo_atual: number; saldo: number };
  movimentos: { id: string; tipo: string; quantidade: number; motivo: string | null; created_at: string }[];
};

export async function getItemComHistorico(id: string): Promise<ItemComHistorico | null> {
  const supabase = await createClient();
  const { data: item } = await supabase.from("inventory_items").select("*").eq("id", id).maybeSingle();
  if (!item) return null;

  const [{ data: movs }, { data: medida }] = await Promise.all([
    supabase.from("stock_movements").select("id, tipo, quantidade, motivo, created_at").eq("item_id", id).order("created_at", { ascending: false }),
    item.measure_id
      ? supabase.from("measurement_units").select("sigla").eq("id", item.measure_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const saldo = (movs ?? []).reduce((s, m) => s + Number(m.quantidade), 0);
  return {
    item: {
      id: item.id,
      nome: item.nome,
      sigla: (medida as { sigla?: string } | null)?.sigla ?? "",
      estoque_minimo: Number(item.estoque_minimo),
      custo_atual: Number(item.custo_atual),
      saldo,
    },
    movimentos: (movs ?? []).map((m) => ({ ...m, quantidade: Number(m.quantidade) })),
  };
}
