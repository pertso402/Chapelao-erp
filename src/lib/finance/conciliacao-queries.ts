import { createClient } from "@/lib/supabase/server";

export type ImportacaoExtrato = {
  id: string;
  nomeArquivo: string;
  formato: string;
  totalLinhas: number;
  criadoEm: string;
  pendentes: number;
};

export async function listarImportacoes(): Promise<ImportacaoExtrato[]> {
  const supabase = await createClient();
  const { data: imports } = await supabase
    .from("bank_statement_imports")
    .select("id, nome_arquivo, formato, total_linhas, created_at")
    .order("created_at", { ascending: false });
  if (!imports || imports.length === 0) return [];

  const { data: linhas } = await supabase
    .from("bank_statement_lines")
    .select("import_id, conciliado")
    .in("import_id", imports.map((i) => i.id));

  const pendentesPorImport = new Map<string, number>();
  for (const l of linhas ?? []) {
    if (!l.conciliado) pendentesPorImport.set(l.import_id, (pendentesPorImport.get(l.import_id) ?? 0) + 1);
  }

  return imports.map((i) => ({
    id: i.id,
    nomeArquivo: i.nome_arquivo,
    formato: i.formato,
    totalLinhas: i.total_linhas,
    criadoEm: i.created_at,
    pendentes: pendentesPorImport.get(i.id) ?? 0,
  }));
}

export type CandidatoMatch = {
  tipo: "payable" | "receivable";
  id: string;
  descricao: string;
  valor: number;
  vencimento: string | null;
};

export type LinhaExtrato = {
  id: string;
  importId: string;
  data: string;
  descricao: string;
  valor: number;
  conciliado: boolean;
  matchTipo: string | null;
  matchId: string | null;
  sugestoes: CandidatoMatch[];
};

function diasEntre(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

// Lista as linhas de um extrato (ou todas, mais recentes primeiro, se importId
// omitido) com sugestões de vínculo: débito casa com payables pendentes,
// crédito casa com receivables pendentes, por valor exato + vencimento
// próximo (±10 dias). Traz conciliadas também — precisa dar pra desfazer.
export async function listarLinhasExtrato(importId?: string): Promise<LinhaExtrato[]> {
  const supabase = await createClient();
  let query = supabase.from("bank_statement_lines").select("*").order("data", { ascending: false }).limit(200);
  if (importId) query = query.eq("import_id", importId);
  const { data: linhas } = await query;
  if (!linhas || linhas.length === 0) return [];

  const [{ data: pagaveis }, { data: recebiveis }] = await Promise.all([
    supabase.from("payables").select("id, descricao, valor, vencimento").eq("status", "pendente"),
    supabase.from("receivables").select("id, descricao, valor, vencimento").eq("status", "pendente"),
  ]);

  return linhas.map((l) => {
    const valorAbs = Math.abs(Number(l.valor));
    const sugestoes: CandidatoMatch[] = [];
    if (Number(l.valor) < 0) {
      for (const p of pagaveis ?? []) {
        if (Math.abs(Number(p.valor) - valorAbs) > 0.01) continue;
        if (p.vencimento && diasEntre(p.vencimento, l.data) > 10) continue;
        sugestoes.push({ tipo: "payable", id: p.id, descricao: p.descricao, valor: Number(p.valor), vencimento: p.vencimento });
      }
    } else {
      for (const r of recebiveis ?? []) {
        if (Math.abs(Number(r.valor) - valorAbs) > 0.01) continue;
        if (r.vencimento && diasEntre(r.vencimento, l.data) > 10) continue;
        sugestoes.push({ tipo: "receivable", id: r.id, descricao: r.descricao, valor: Number(r.valor), vencimento: r.vencimento });
      }
    }
    return {
      id: l.id,
      importId: l.import_id,
      data: l.data,
      descricao: l.descricao,
      valor: Number(l.valor),
      conciliado: l.conciliado,
      matchTipo: l.match_tipo,
      matchId: l.match_id,
      sugestoes,
    };
  });
}

export async function resumoConciliacao(): Promise<{ totalLinhas: number; pendentes: number; conciliadas: number }> {
  const supabase = await createClient();
  const { count: total } = await supabase.from("bank_statement_lines").select("*", { count: "exact", head: true });
  const { count: pendentes } = await supabase.from("bank_statement_lines").select("*", { count: "exact", head: true }).eq("conciliado", false);
  return { totalLinhas: total ?? 0, pendentes: pendentes ?? 0, conciliadas: (total ?? 0) - (pendentes ?? 0) };
}
