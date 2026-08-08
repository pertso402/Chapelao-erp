import { createClient } from "@/lib/supabase/server";

export type ClienteLista = {
  id: string;
  nome: string;
  telefone: string;
  pedidos: number;
  totalGasto: number;
  ultimoPedido: string | null;
  diasSemComprar: number | null;
  segmento: "novo" | "ativo" | "em_risco" | "inativo" | "sem_pedido";
};

function segmentar(dias: number | null): ClienteLista["segmento"] {
  if (dias == null) return "sem_pedido";
  if (dias <= 15) return "ativo";
  if (dias <= 30) return "em_risco";
  return "inativo";
}

// Lista de clientes com métricas calculadas a partir dos PEDIDOS reais
// (não confia em campos de cache como total_pedidos/ultimo_pedido, que podem
// estar desatualizados — mesmo princípio de ledger do resto do sistema).
export async function listarClientesComMetricas(): Promise<ClienteLista[]> {
  const supabase = await createClient();
  const [{ data: clientes }, { data: pedidos }] = await Promise.all([
    supabase.from("clientes").select("id, nome, telefone").order("nome"),
    supabase.from("pedidos").select("cliente_id, total, status, created_at"),
  ]);

  const porCliente = new Map<string, { pedidos: number; total: number; ultimo: string | null }>();
  for (const p of pedidos ?? []) {
    if (p.status && /cancel/i.test(p.status)) continue;
    const cur = porCliente.get(p.cliente_id) ?? { pedidos: 0, total: 0, ultimo: null };
    cur.pedidos += 1;
    cur.total += Number(p.total ?? 0);
    if (!cur.ultimo || (p.created_at && p.created_at > cur.ultimo)) cur.ultimo = p.created_at;
    porCliente.set(p.cliente_id, cur);
  }

  const hoje = Date.now();
  return (clientes ?? []).map((c) => {
    const m = porCliente.get(c.id);
    const dias = m?.ultimo ? Math.floor((hoje - new Date(m.ultimo).getTime()) / 864e5) : null;
    return {
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      pedidos: m?.pedidos ?? 0,
      totalGasto: Number((m?.total ?? 0).toFixed(2)),
      ultimoPedido: m?.ultimo ?? null,
      diasSemComprar: dias,
      segmento: segmentar(dias),
    };
  });
}

export type ResumoClientes = {
  total: number;
  ativos: number;
  emRisco: number;
  inativos: number;
  semPedido: number;
};

export async function resumoClientes(): Promise<ResumoClientes> {
  const lista = await listarClientesComMetricas();
  return {
    total: lista.length,
    ativos: lista.filter((c) => c.segmento === "ativo").length,
    emRisco: lista.filter((c) => c.segmento === "em_risco").length,
    inativos: lista.filter((c) => c.segmento === "inativo").length,
    semPedido: lista.filter((c) => c.segmento === "sem_pedido").length,
  };
}

export type CupomLista = {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string | null;
  descontoPercentual: number;
  validoAte: string;
  usado: boolean;
  clienteNome: string | null;
};

export async function listarCupons(): Promise<CupomLista[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cupons")
    .select("id, codigo, tipo, descricao, desconto_percentual, valido_ate, usado, clientes(nome)")
    .order("created_at", { ascending: false })
    .limit(200);

  return ((data ?? []) as unknown as {
    id: string; codigo: string; tipo: string; descricao: string | null; desconto_percentual: number;
    valido_ate: string; usado: boolean; clientes: { nome: string } | null;
  }[]).map((c) => ({
    id: c.id, codigo: c.codigo, tipo: c.tipo, descricao: c.descricao,
    descontoPercentual: Number(c.desconto_percentual), validoAte: c.valido_ate, usado: c.usado,
    clienteNome: c.clientes?.nome ?? null,
  }));
}

export type OfertaLista = {
  id: string;
  clienteNome: string | null;
  tipoOferta: string;
  diasSemComprar: number;
  enviadoEm: string | null;
  converteu: boolean | null;
  cupomCodigo: string | null;
};

export async function listarOfertas(): Promise<OfertaLista[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ofertas_enviadas")
    .select("id, tipo_oferta, dias_sem_comprar, enviado_em, converteu, cupom_codigo, clientes(nome)")
    .order("enviado_em", { ascending: false })
    .limit(200);

  return ((data ?? []) as unknown as {
    id: string; tipo_oferta: string; dias_sem_comprar: number; enviado_em: string | null;
    converteu: boolean | null; cupom_codigo: string | null; clientes: { nome: string } | null;
  }[]).map((o) => ({
    id: o.id, clienteNome: o.clientes?.nome ?? null, tipoOferta: o.tipo_oferta,
    diasSemComprar: o.dias_sem_comprar, enviadoEm: o.enviado_em, converteu: o.converteu, cupomCodigo: o.cupom_codigo,
  }));
}

export type IndicacaoLista = {
  id: string;
  indicadoPor: string | null;
  nomeIndicado: string;
  status: string;
  convertidoEm: string | null;
};

export async function listarIndicacoes(): Promise<IndicacaoLista[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("indicacoes")
    .select("id, nome_indicado, status, convertido_em, clientes!indicacoes_indicado_por_fkey(nome)")
    .order("created_at", { ascending: false })
    .limit(200);

  return ((data ?? []) as unknown as {
    id: string; nome_indicado: string; status: string; convertido_em: string | null; clientes: { nome: string } | null;
  }[]).map((i) => ({
    id: i.id, indicadoPor: i.clientes?.nome ?? null, nomeIndicado: i.nome_indicado, status: i.status, convertidoEm: i.convertido_em,
  }));
}
