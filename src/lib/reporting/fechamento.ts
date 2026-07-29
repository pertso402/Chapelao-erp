import { createClient } from "@/lib/supabase/server";

export type FechamentoMensal = {
  periodo: { de: string; ate: string };
  vendas: {
    totalPedidos: number;
    receitaBruta: number;
    descontos: number;
    receitaLiquida: number;
    porPagamento: { forma: string; total: number }[];
    cancelamentos: number;
  };
  compras: {
    fornecedor: string;
    total: number;
    anexoNome: string | null;
    anexoUrl: string | null;
    dataCompra: string;
  }[];
  totalCompras: number;
  contasPagas: { descricao: string; valor: number; pagoEm: string | null }[];
  totalPago: number;
  contasRecebidas: { descricao: string; valor: number; pagoEm: string | null }[];
  totalRecebido: number;
};

const cancelado = (s: string | null | undefined) => !!s && /cancel/i.test(s);

// Pacote de fechamento do mês para entregar ao contador — só é gerado quando
// o usuário pede (nunca automaticamente).
export async function gerarFechamentoMensal(de: string, ate: string): Promise<FechamentoMensal> {
  const supabase = await createClient();
  const inicio = `${de}T00:00:00`;
  const fim = `${ate}T23:59:59`;

  const [{ data: pedidos }, { data: comprasRaw }, { data: payables }, { data: receivables }] = await Promise.all([
    supabase.from("pedidos").select("total, subtotal, desconto, forma_pagamento, status").gte("created_at", inicio).lte("created_at", fim),
    supabase.from("purchases").select("total, created_at, anexo_path, anexo_nome, suppliers(nome)").gte("created_at", inicio).lte("created_at", fim),
    supabase.from("payables").select("descricao, valor, pago_em").eq("status", "pago").gte("pago_em", inicio).lte("pago_em", fim),
    supabase.from("receivables").select("descricao, valor, pago_em").eq("status", "pago").gte("pago_em", inicio).lte("pago_em", fim),
  ]);

  const validos = (pedidos ?? []).filter((p) => !cancelado(p.status));
  const cancelados = (pedidos ?? []).length - validos.length;
  const receitaBruta = validos.reduce((s, p) => s + Number(p.subtotal ?? p.total ?? 0), 0);
  const descontos = validos.reduce((s, p) => s + Number(p.desconto ?? 0), 0);
  const receitaLiquida = validos.reduce((s, p) => s + Number(p.total ?? 0), 0);

  const pagMap = new Map<string, number>();
  for (const p of validos) {
    const k = p.forma_pagamento || "—";
    pagMap.set(k, (pagMap.get(k) ?? 0) + Number(p.total ?? 0));
  }

  const comprasRows = (comprasRaw ?? []) as unknown as {
    total: number; created_at: string; anexo_path: string | null; anexo_nome: string | null; suppliers: { nome: string } | null;
  }[];
  const compras = await Promise.all(
    comprasRows.map(async (c) => {
      let anexoUrl: string | null = null;
      if (c.anexo_path) {
        const { data: signed } = await supabase.storage.from("compras-documentos").createSignedUrl(c.anexo_path, 60 * 10);
        anexoUrl = signed?.signedUrl ?? null;
      }
      return { fornecedor: c.suppliers?.nome ?? "—", total: Number(c.total), anexoNome: c.anexo_nome, anexoUrl, dataCompra: c.created_at };
    }),
  );

  return {
    periodo: { de, ate },
    vendas: {
      totalPedidos: validos.length,
      receitaBruta: Number(receitaBruta.toFixed(2)),
      descontos: Number(descontos.toFixed(2)),
      receitaLiquida: Number(receitaLiquida.toFixed(2)),
      porPagamento: [...pagMap.entries()].map(([forma, total]) => ({ forma, total: Number(total.toFixed(2)) })),
      cancelamentos: cancelados,
    },
    compras,
    totalCompras: Number(compras.reduce((s, c) => s + c.total, 0).toFixed(2)),
    contasPagas: (payables ?? []).map((p) => ({ descricao: p.descricao, valor: Number(p.valor), pagoEm: p.pago_em })),
    totalPago: Number((payables ?? []).reduce((s, p) => s + Number(p.valor), 0).toFixed(2)),
    contasRecebidas: (receivables ?? []).map((r) => ({ descricao: r.descricao, valor: Number(r.valor), pagoEm: r.pago_em })),
    totalRecebido: Number((receivables ?? []).reduce((s, r) => s + Number(r.valor), 0).toFixed(2)),
  };
}
