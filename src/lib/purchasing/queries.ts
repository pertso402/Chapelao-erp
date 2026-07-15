import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.generated";

export type Fornecedor = Tables<"suppliers">;

export async function listarFornecedores(): Promise<Fornecedor[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("*").eq("ativo", true).order("nome");
  return data ?? [];
}

export type CompraLista = {
  id: string;
  fornecedor: string;
  total: number;
  status: string;
  created_at: string;
  itens: number;
};

export async function listarCompras(): Promise<CompraLista[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("id, total, status, created_at, suppliers(nome), purchase_items(id)")
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as unknown as {
    id: string; total: number; status: string; created_at: string;
    suppliers: { nome: string } | null; purchase_items: { id: string }[] | null;
  }[]).map((p) => ({
    id: p.id,
    fornecedor: p.suppliers?.nome ?? "—",
    total: Number(p.total),
    status: p.status,
    created_at: p.created_at,
    itens: (p.purchase_items ?? []).length,
  }));
}
