import { createClient } from "@/lib/supabase/server";

export type CaixaAberto = {
  id: string;
  saldo_inicial: number;
  aberta_em: string;
  vendas: { dinheiro: number; pix: number; cartao: number; outros: number };
  suprimentos: number;
  sangrias: number;
  despesas: number;
  esperado: { dinheiro: number; pix: number; cartao: number };
  movimentos: { id: string; tipo: string; valor: number; motivo: string | null; created_at: string }[];
};

function normForma(f: string | null): "dinheiro" | "pix" | "cartao" | "outros" {
  const t = (f ?? "").toLowerCase();
  if (t.includes("dinheiro")) return "dinheiro";
  if (t.includes("pix")) return "pix";
  if (t.includes("cart")) return "cartao";
  return "outros";
}

// Sessão de caixa aberta (se houver) com o esperado por forma de pagamento.
export async function getCaixaAberto(): Promise<CaixaAberto | null> {
  const supabase = await createClient();
  const { data: sessao } = await supabase
    .from("cash_sessions")
    .select("*")
    .eq("status", "aberta")
    .order("aberta_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sessao) return null;

  const [{ data: pedidos }, { data: movs }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("total, forma_pagamento, status")
      .gte("created_at", sessao.aberta_em),
    supabase.from("cash_movements").select("*").eq("session_id", sessao.id).order("created_at"),
  ]);

  const vendas = { dinheiro: 0, pix: 0, cartao: 0, outros: 0 };
  for (const p of pedidos ?? []) {
    if (p.status && /cancel/i.test(p.status)) continue;
    vendas[normForma(p.forma_pagamento)] += Number(p.total ?? 0);
  }

  let suprimentos = 0, sangrias = 0, despesas = 0;
  for (const m of movs ?? []) {
    if (m.tipo === "suprimento") suprimentos += Number(m.valor);
    else if (m.tipo === "sangria") sangrias += Number(m.valor);
    else if (m.tipo === "despesa") despesas += Number(m.valor);
  }

  const esperadoDinheiro = Number(sessao.saldo_inicial) + vendas.dinheiro + suprimentos - sangrias - despesas;

  return {
    id: sessao.id,
    saldo_inicial: Number(sessao.saldo_inicial),
    aberta_em: sessao.aberta_em,
    vendas,
    suprimentos,
    sangrias,
    despesas,
    esperado: { dinheiro: Number(esperadoDinheiro.toFixed(2)), pix: vendas.pix, cartao: vendas.cartao },
    movimentos: (movs ?? []).map((m) => ({ id: m.id, tipo: m.tipo, valor: Number(m.valor), motivo: m.motivo, created_at: m.created_at })),
  };
}

export async function ultimosFechamentos(limite = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_sessions")
    .select("id, aberta_em, fechada_em, fechamento")
    .eq("status", "fechada")
    .order("fechada_em", { ascending: false })
    .limit(limite);
  return data ?? [];
}
