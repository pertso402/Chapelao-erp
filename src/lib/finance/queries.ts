import { createClient } from "@/lib/supabase/server";

export type RecebivelLista = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string | null;
  status: string;
  company_invoice_id: string | null;
};

export async function listarRecebiveis(): Promise<RecebivelLista[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("receivables")
    .select("id, descricao, valor, vencimento, status, company_invoice_id")
    .order("status")
    .order("vencimento");
  return (data ?? []).map((r) => ({ ...r, valor: Number(r.valor) }));
}

export async function resumoReceber(): Promise<{ pendente: number; recebido: number; vencido: number }> {
  const recs = await listarRecebiveis();
  const hoje = new Date().toISOString().slice(0, 10);
  let pendente = 0, recebido = 0, vencido = 0;
  for (const r of recs) {
    if (r.status === "pago") recebido += r.valor;
    else if (r.status === "pendente") {
      pendente += r.valor;
      if (r.vencimento && r.vencimento < hoje) vencido += r.valor;
    }
  }
  return { pendente, recebido, vencido };
}
