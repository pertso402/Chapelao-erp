import { createClient } from "@/lib/supabase/server";

export type ProdutoCardapio = {
  id: string;
  nome: string;
  categoria: string | null;
  preco: number;
  preco_promocional: number | null;
};

export function precoFinal(p: { preco: number; preco_promocional: number | null }): number {
  return p.preco_promocional != null ? Number(p.preco_promocional) : Number(p.preco);
}

// Produtos disponíveis para montar um pedido de balcão.
export async function listarProdutosDisponiveis(): Promise<ProdutoCardapio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, categoria, preco, preco_promocional")
    .eq("disponivel", true)
    .order("categoria")
    .order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []) as ProdutoCardapio[];
}

export type OpcaoItem = { id: string; nome: string; preco_adicional: number; disponivel: boolean };
export type GrupoOpcao = {
  id: string;
  nome: string;
  min_escolhas: number;
  max_escolhas: number | null;
  opcoes: OpcaoItem[];
};
export type ProdutoComOpcoes = {
  id: string;
  nome: string;
  categoria: string | null;
  preco: number;
  grupos: GrupoOpcao[];
};

// Cardápio completo com os grupos de opções de cada produto (para montagem guiada).
export async function listarCardapioComOpcoes(): Promise<ProdutoComOpcoes[]> {
  const supabase = await createClient();

  const [{ data: produtos }, { data: pog }, { data: grupos }, { data: opcoes }] = await Promise.all([
    supabase.from("produtos").select("id, nome, categoria, preco, preco_promocional").eq("disponivel", true).order("categoria").order("nome"),
    supabase.from("product_option_groups").select("produto_id, group_id, ordem"),
    supabase.from("option_groups").select("id, nome, min_escolhas, max_escolhas"),
    supabase.from("options").select("id, group_id, nome, preco_adicional, disponivel, ordem").order("ordem"),
  ]);

  const grupoById = new Map((grupos ?? []).map((g) => [g.id, g]));
  const opcoesByGrupo = new Map<string, OpcaoItem[]>();
  for (const o of opcoes ?? []) {
    if (!o.disponivel) continue;
    const arr = opcoesByGrupo.get(o.group_id) ?? [];
    arr.push({ id: o.id, nome: o.nome, preco_adicional: Number(o.preco_adicional), disponivel: o.disponivel });
    opcoesByGrupo.set(o.group_id, arr);
  }

  const gruposByProduto = new Map<string, GrupoOpcao[]>();
  for (const link of (pog ?? []).sort((a, b) => a.ordem - b.ordem)) {
    const g = grupoById.get(link.group_id);
    if (!g) continue;
    const arr = gruposByProduto.get(link.produto_id) ?? [];
    arr.push({
      id: g.id, nome: g.nome, min_escolhas: g.min_escolhas, max_escolhas: g.max_escolhas,
      opcoes: opcoesByGrupo.get(g.id) ?? [],
    });
    gruposByProduto.set(link.produto_id, arr);
  }

  return (produtos ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    categoria: p.categoria,
    preco: precoFinal(p),
    grupos: gruposByProduto.get(p.id) ?? [],
  }));
}
