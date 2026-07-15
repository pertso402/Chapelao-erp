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
