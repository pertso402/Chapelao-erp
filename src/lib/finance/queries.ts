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

export type PagavelLista = {
  id: string;
  descricao: string;
  fornecedor: string | null;
  valor: number;
  vencimento: string | null;
  status: string;
};

export async function listarPagaveis(): Promise<PagavelLista[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payables")
    .select("id, descricao, valor, vencimento, status, suppliers(nome)")
    .order("status")
    .order("vencimento");
  return ((data ?? []) as unknown as {
    id: string; descricao: string; valor: number; vencimento: string | null; status: string; suppliers: { nome: string } | null;
  }[]).map((p) => ({ id: p.id, descricao: p.descricao, fornecedor: p.suppliers?.nome ?? null, valor: Number(p.valor), vencimento: p.vencimento, status: p.status }));
}

export async function resumoPagar(): Promise<{ pendente: number; pago: number; vencido: number }> {
  const pgs = await listarPagaveis();
  const hoje = new Date().toISOString().slice(0, 10);
  let pendente = 0, pago = 0, vencido = 0;
  for (const p of pgs) {
    if (p.status === "pago") pago += p.valor;
    else if (p.status === "pendente") {
      pendente += p.valor;
      if (p.vencimento && p.vencimento < hoje) vencido += p.valor;
    }
  }
  return { pendente, pago, vencido };
}
