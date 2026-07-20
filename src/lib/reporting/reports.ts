import { createClient } from "@/lib/supabase/server";

export type Coluna = { key: string; label: string; align?: "right" };
export type Linha = Record<string, string | number>;
export type Relatorio = {
  titulo: string;
  colunas: Coluna[];
  linhas: Linha[];
  totais?: Linha;
};

export const TIPOS_RELATORIO = [
  { valor: "vendas_dia", label: "Vendas por dia" },
  { valor: "vendas_canal", label: "Vendas por canal" },
  { valor: "vendas_produto", label: "Vendas por produto" },
  { valor: "vendas_pagamento", label: "Vendas por forma de pagamento" },
  { valor: "consumo_b2b", label: "Consumo B2B por empresa" },
  { valor: "estoque", label: "Posição de estoque" },
  { valor: "contas_pagar", label: "Contas a pagar" },
  { valor: "contas_receber", label: "Contas a receber" },
] as const;

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const cancelado = (s: string | null | undefined) => !!s && /cancel/i.test(s);

export async function gerarRelatorio(tipo: string, de: string, ate: string): Promise<Relatorio> {
  const supabase = await createClient();
  const inicio = `${de}T00:00:00`;
  const fim = `${ate}T23:59:59`;

  const vendas = async () => {
    const { data } = await supabase
      .from("pedidos")
      .select("total, canal, forma_pagamento, status, created_at, company_id")
      .gte("created_at", inicio)
      .lte("created_at", fim);
    return (data ?? []).filter((p) => !cancelado(p.status));
  };

  switch (tipo) {
    case "vendas_dia": {
      const ps = await vendas();
      const g = new Map<string, { pedidos: number; total: number }>();
      for (const p of ps) {
        const d = (p.created_at ?? "").slice(0, 10);
        const cur = g.get(d) ?? { pedidos: 0, total: 0 };
        cur.pedidos += 1; cur.total += Number(p.total ?? 0);
        g.set(d, cur);
      }
      const linhas = [...g.entries()].sort().map(([d, v]) => ({
        dia: new Date(d + "T12:00:00").toLocaleDateString("pt-BR"), pedidos: v.pedidos, total: brl(v.total),
      }));
      const tot = ps.reduce((s, p) => s + Number(p.total ?? 0), 0);
      return { titulo: "Vendas por dia", colunas: [{ key: "dia", label: "Dia" }, { key: "pedidos", label: "Pedidos", align: "right" }, { key: "total", label: "Total", align: "right" }], linhas, totais: { dia: "TOTAL", pedidos: ps.length, total: brl(tot) } };
    }
    case "vendas_canal": {
      const ps = await vendas();
      const g = new Map<string, { pedidos: number; total: number }>();
      for (const p of ps) { const k = p.canal || "—"; const c = g.get(k) ?? { pedidos: 0, total: 0 }; c.pedidos++; c.total += Number(p.total ?? 0); g.set(k, c); }
      const linhas = [...g.entries()].map(([k, v]) => ({ canal: k, pedidos: v.pedidos, total: brl(v.total) }));
      const tot = ps.reduce((s, p) => s + Number(p.total ?? 0), 0);
      return { titulo: "Vendas por canal", colunas: [{ key: "canal", label: "Canal" }, { key: "pedidos", label: "Pedidos", align: "right" }, { key: "total", label: "Total", align: "right" }], linhas, totais: { canal: "TOTAL", pedidos: ps.length, total: brl(tot) } };
    }
    case "vendas_pagamento": {
      const ps = await vendas();
      const g = new Map<string, { pedidos: number; total: number }>();
      for (const p of ps) { const k = p.forma_pagamento || "—"; const c = g.get(k) ?? { pedidos: 0, total: 0 }; c.pedidos++; c.total += Number(p.total ?? 0); g.set(k, c); }
      const linhas = [...g.entries()].map(([k, v]) => ({ forma: k, pedidos: v.pedidos, total: brl(v.total) }));
      const tot = ps.reduce((s, p) => s + Number(p.total ?? 0), 0);
      return { titulo: "Vendas por forma de pagamento", colunas: [{ key: "forma", label: "Forma" }, { key: "pedidos", label: "Pedidos", align: "right" }, { key: "total", label: "Total", align: "right" }], linhas, totais: { forma: "TOTAL", pedidos: ps.length, total: brl(tot) } };
    }
    case "vendas_produto": {
      const { data } = await supabase
        .from("itens_pedido")
        .select("nome_produto, quantidade, total, pedidos!inner(created_at, status)")
        .gte("pedidos.created_at", inicio)
        .lte("pedidos.created_at", fim);
      const rows = ((data ?? []) as unknown as { nome_produto: string; quantidade: number; total: number; pedidos: { status: string | null } }[]).filter((r) => !cancelado(r.pedidos?.status));
      const g = new Map<string, { qtd: number; total: number }>();
      for (const r of rows) { const c = g.get(r.nome_produto) ?? { qtd: 0, total: 0 }; c.qtd += Number(r.quantidade ?? 0); c.total += Number(r.total ?? 0); g.set(r.nome_produto, c); }
      const linhas = [...g.entries()].sort((a, b) => b[1].total - a[1].total).map(([k, v]) => ({ produto: k, qtd: v.qtd, total: brl(v.total) }));
      const tot = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
      return { titulo: "Vendas por produto", colunas: [{ key: "produto", label: "Produto" }, { key: "qtd", label: "Qtd", align: "right" }, { key: "total", label: "Total", align: "right" }], linhas, totais: { produto: "TOTAL", qtd: rows.reduce((s, r) => s + Number(r.quantidade ?? 0), 0), total: brl(tot) } };
    }
    case "consumo_b2b": {
      const ps = (await vendas()).filter((p) => p.company_id);
      const { data: emps } = await supabase.from("companies").select("id, razao_social, nome_fantasia");
      const nome = new Map((emps ?? []).map((e) => [e.id, e.nome_fantasia || e.razao_social]));
      const g = new Map<string, { pedidos: number; total: number }>();
      for (const p of ps) { const k = nome.get(p.company_id!) ?? "—"; const c = g.get(k) ?? { pedidos: 0, total: 0 }; c.pedidos++; c.total += Number(p.total ?? 0); g.set(k, c); }
      const linhas = [...g.entries()].map(([k, v]) => ({ empresa: k, pedidos: v.pedidos, total: brl(v.total) }));
      const tot = ps.reduce((s, p) => s + Number(p.total ?? 0), 0);
      return { titulo: "Consumo B2B por empresa", colunas: [{ key: "empresa", label: "Empresa" }, { key: "pedidos", label: "Pedidos", align: "right" }, { key: "total", label: "Total", align: "right" }], linhas, totais: { empresa: "TOTAL", pedidos: ps.length, total: brl(tot) } };
    }
    case "estoque": {
      const { data: itens } = await supabase.from("inventory_items").select("id, nome, estoque_minimo, custo_atual, measure_id").eq("ativo", true).order("nome");
      const { data: saldos } = await supabase.from("v_inventory_balance").select("item_id, saldo");
      const { data: medidas } = await supabase.from("measurement_units").select("id, sigla");
      const saldoM = new Map((saldos ?? []).map((s) => [s.item_id, Number(s.saldo)]));
      const sigM = new Map((medidas ?? []).map((m) => [m.id, m.sigla]));
      let totalValor = 0;
      const linhas = (itens ?? []).map((i) => {
        const saldo = saldoM.get(i.id) ?? 0; const sig = i.measure_id ? sigM.get(i.measure_id) ?? "" : "";
        const valor = Math.max(0, saldo) * Number(i.custo_atual); totalValor += valor;
        return { item: i.nome, saldo: `${saldo} ${sig}`, minimo: `${i.estoque_minimo} ${sig}`, status: saldo < Number(i.estoque_minimo) ? "⚠ abaixo" : "ok", valor: brl(valor) };
      });
      return { titulo: "Posição de estoque", colunas: [{ key: "item", label: "Item" }, { key: "saldo", label: "Saldo", align: "right" }, { key: "minimo", label: "Mínimo", align: "right" }, { key: "status", label: "Status" }, { key: "valor", label: "Valor", align: "right" }], linhas, totais: { item: "TOTAL", saldo: "", minimo: "", status: "", valor: brl(totalValor) } };
    }
    case "contas_pagar":
    case "contas_receber": {
      const tabela = tipo === "contas_pagar" ? "payables" : "receivables";
      const { data } = await supabase.from(tabela).select("descricao, valor, vencimento, status").gte("vencimento", de).lte("vencimento", ate).order("vencimento");
      const linhas = (data ?? []).map((c) => ({ descricao: c.descricao, vencimento: c.vencimento ? new Date(c.vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "—", status: c.status, valor: brl(Number(c.valor)) }));
      const tot = (data ?? []).reduce((s, c) => s + Number(c.valor), 0);
      return { titulo: tipo === "contas_pagar" ? "Contas a pagar" : "Contas a receber", colunas: [{ key: "descricao", label: "Descrição" }, { key: "vencimento", label: "Vencimento" }, { key: "status", label: "Status" }, { key: "valor", label: "Valor", align: "right" }], linhas, totais: { descricao: "TOTAL", vencimento: "", status: "", valor: brl(tot) } };
    }
    default:
      return { titulo: "Relatório", colunas: [], linhas: [] };
  }
}
