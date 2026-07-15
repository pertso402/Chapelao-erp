import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.generated";

export async function listarPlanoContas(): Promise<Tables<"chart_of_accounts">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("chart_of_accounts").select("*").order("ordem");
  return data ?? [];
}

export async function listarCentrosCusto(): Promise<Tables<"cost_centers">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("cost_centers").select("*").eq("ativo", true).order("nome");
  return data ?? [];
}

export type EventoAgenda = {
  tipo: "receber" | "pagar";
  descricao: string;
  valor: number;
  vencimento: string | null;
  status: string;
};

// Agenda financeira: obrigações e recebíveis pendentes ordenados por vencimento.
export async function agendaFinanceira(): Promise<EventoAgenda[]> {
  const supabase = await createClient();
  const [{ data: recs }, { data: pays }] = await Promise.all([
    supabase.from("receivables").select("descricao, valor, vencimento, status").eq("status", "pendente"),
    supabase.from("payables").select("descricao, valor, vencimento, status").eq("status", "pendente"),
  ]);
  const eventos: EventoAgenda[] = [
    ...(recs ?? []).map((r) => ({ tipo: "receber" as const, descricao: r.descricao, valor: Number(r.valor), vencimento: r.vencimento, status: r.status })),
    ...(pays ?? []).map((p) => ({ tipo: "pagar" as const, descricao: p.descricao, valor: Number(p.valor), vencimento: p.vencimento, status: p.status })),
  ];
  return eventos.sort((a, b) => (a.vencimento ?? "9999").localeCompare(b.vencimento ?? "9999"));
}

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
