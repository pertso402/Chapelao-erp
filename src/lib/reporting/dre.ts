import { createClient } from "@/lib/supabase/server";
import { cmvTeoricoMes } from "@/lib/recipes/queries";

export type LinhaDespesa = { categoria: string; valor: number };

export type DRE = {
  periodo: string;
  receitaBruta: number;
  descontos: number;
  receitaLiquida: number;
  cmv: number;
  margemBruta: number;
  margemBrutaPct: number;
  despesas: LinhaDespesa[];
  totalDespesas: number;
  resultado: number;
  resultadoPct: number;
  naoClassificadas: number; // contas a pagar sem categoria (alerta)
};

export async function dreDoMes(): Promise<DRE> {
  const supabase = await createClient();
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimExcl = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

  // Receita: pedidos do mês (não cancelados)
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("subtotal, taxa_entrega, desconto, total, status")
    .gte("created_at", inicio.toISOString())
    .lt("created_at", fimExcl.toISOString());

  let receitaBruta = 0, descontos = 0, receitaLiquida = 0;
  for (const p of pedidos ?? []) {
    if (p.status && /cancel/i.test(p.status)) continue;
    receitaBruta += Number(p.subtotal ?? 0) + Number(p.taxa_entrega ?? 0);
    descontos += Number(p.desconto ?? 0);
    receitaLiquida += Number(p.total ?? 0);
  }

  // CMV teórico (fichas × vendas)
  const cmvMes = await cmvTeoricoMes();
  const cmv = cmvMes.cmv;
  const margemBruta = receitaLiquida - cmv;

  // Despesas operacionais: payables do mês classificadas como 'despesa'
  const { data: pays } = await supabase
    .from("payables")
    .select("valor, vencimento, created_at, account_id, chart_of_accounts(nome, tipo)")
    .or(
      `and(vencimento.gte.${inicio.toISOString().slice(0, 10)},vencimento.lt.${fimExcl.toISOString().slice(0, 10)}),and(vencimento.is.null,created_at.gte.${inicio.toISOString()})`,
    );

  const porCategoria = new Map<string, number>();
  let naoClassificadas = 0;
  for (const p of (pays ?? []) as unknown as { valor: number; account_id: string | null; chart_of_accounts: { nome: string; tipo: string } | null }[]) {
    const conta = p.chart_of_accounts;
    if (!conta || !p.account_id) { naoClassificadas += Number(p.valor); continue; }
    if (conta.tipo !== "despesa") continue; // CMV/compras não entram como despesa operacional
    porCategoria.set(conta.nome, (porCategoria.get(conta.nome) ?? 0) + Number(p.valor));
  }

  const despesas = [...porCategoria.entries()]
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const resultado = margemBruta - totalDespesas;

  return {
    periodo: inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    receitaBruta: Number(receitaBruta.toFixed(2)),
    descontos: Number(descontos.toFixed(2)),
    receitaLiquida: Number(receitaLiquida.toFixed(2)),
    cmv,
    margemBruta: Number(margemBruta.toFixed(2)),
    margemBrutaPct: receitaLiquida > 0 ? (margemBruta / receitaLiquida) * 100 : 0,
    despesas,
    totalDespesas: Number(totalDespesas.toFixed(2)),
    resultado: Number(resultado.toFixed(2)),
    resultadoPct: receitaLiquida > 0 ? (resultado / receitaLiquida) * 100 : 0,
    naoClassificadas: Number(naoClassificadas.toFixed(2)),
  };
}
