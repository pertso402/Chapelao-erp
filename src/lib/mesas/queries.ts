import { createClient } from "@/lib/supabase/server";

export type ItemComanda = {
  id: string;
  produto_id: string | null;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  composicao: string | null;
  opcoes: { option_id: string; nome: string; preco: number }[];
};

export type Comanda = {
  id: string;
  numero_mesa: number;
  status: string;
  aberta_em: string;
  itens: ItemComanda[];
  total: number;
};

function mapItens(raw: unknown[]): ItemComanda[] {
  return (raw as {
    id: string; produto_id: string | null; nome_produto: string; quantidade: number;
    preco_unitario: number; total: number; composicao: string | null; opcoes: unknown;
  }[]).map((i) => ({
    id: i.id,
    produto_id: i.produto_id,
    nome_produto: i.nome_produto,
    quantidade: Number(i.quantidade),
    preco_unitario: Number(i.preco_unitario),
    total: Number(i.total),
    composicao: i.composicao,
    opcoes: (i.opcoes as ItemComanda["opcoes"]) ?? [],
  }));
}

// Mesas abertas (para o painel do garçom).
export async function listarComandasAbertas(): Promise<Comanda[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("id, numero_mesa, status, aberta_em, comanda_itens(id, produto_id, nome_produto, quantidade, preco_unitario, total, composicao, opcoes)")
    .eq("status", "aberta")
    .order("numero_mesa");

  return ((data ?? []) as unknown as {
    id: string; numero_mesa: number; status: string; aberta_em: string; comanda_itens: unknown[] | null;
  }[]).map((c) => {
    const itens = mapItens(c.comanda_itens ?? []);
    return {
      id: c.id, numero_mesa: c.numero_mesa, status: c.status, aberta_em: c.aberta_em,
      itens, total: itens.reduce((s, i) => s + i.total, 0),
    };
  });
}

export async function getComanda(id: string): Promise<Comanda | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("id, numero_mesa, status, aberta_em, comanda_itens(id, produto_id, nome_produto, quantidade, preco_unitario, total, composicao, opcoes)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const d = data as unknown as { id: string; numero_mesa: number; status: string; aberta_em: string; comanda_itens: unknown[] | null };
  const itens = mapItens(d.comanda_itens ?? []);
  return { id: d.id, numero_mesa: d.numero_mesa, status: d.status, aberta_em: d.aberta_em, itens, total: itens.reduce((s, i) => s + i.total, 0) };
}
