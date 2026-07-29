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
  anexoUrl: string | null;
  anexoNome: string | null;
};

export async function listarCompras(): Promise<CompraLista[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("id, total, status, created_at, anexo_path, anexo_nome, suppliers(nome), purchase_items(id)")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as unknown as {
    id: string; total: number; status: string; created_at: string;
    anexo_path: string | null; anexo_nome: string | null;
    suppliers: { nome: string } | null; purchase_items: { id: string }[] | null;
  }[];

  const resultados = await Promise.all(
    rows.map(async (p) => {
      let anexoUrl: string | null = null;
      if (p.anexo_path) {
        const { data: signed } = await supabase.storage
          .from("compras-documentos")
          .createSignedUrl(p.anexo_path, 60 * 10); // 10 min
        anexoUrl = signed?.signedUrl ?? null;
      }
      return {
        id: p.id,
        fornecedor: p.suppliers?.nome ?? "—",
        total: Number(p.total),
        status: p.status,
        created_at: p.created_at,
        itens: (p.purchase_items ?? []).length,
        anexoUrl,
        anexoNome: p.anexo_nome,
      };
    }),
  );
  return resultados;
}
