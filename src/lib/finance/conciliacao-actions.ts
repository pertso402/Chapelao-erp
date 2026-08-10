"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { parseExtrato, fingerprint } from "@/lib/finance/bank-statement";

// Lê o arquivo (OFX/CSV) e grava as linhas do extrato — não mexe em
// payables/receivables/cash_movements. Concilia é um passo humano separado
// (conciliarLinha), igual ao princípio do resto do projeto.
export async function importarExtrato(input: { nomeArquivo: string; texto: string }) {
  const user = await requirePermission("finance.manage");
  const parsed = parseExtrato(input.nomeArquivo, input.texto);
  if (!parsed.ok) return { ok: false as const, erro: parsed.erro };

  const supabase = await createClient();
  const { data: imp, error: impErr } = await supabase
    .from("bank_statement_imports")
    .insert({
      unit_id: user.profile?.unit_id ?? null,
      nome_arquivo: input.nomeArquivo,
      formato: parsed.formato,
      total_linhas: parsed.linhas.length,
      importado_por: user.id,
    })
    .select("id")
    .single();
  if (impErr) return { ok: false as const, erro: impErr.message };

  const linhasComFitid = await Promise.all(
    parsed.linhas.map(async (l) => ({
      import_id: imp.id,
      unit_id: user.profile?.unit_id ?? null,
      data: l.data,
      descricao: l.descricao,
      valor: l.valor,
      fitid: l.fitid ?? (await fingerprint(l)),
    }))
  );

  // Ignora duplicadas (mesmo fitid já importado antes) — não é erro, é normal
  // reimportar um extrato que já tem trechos conhecidos.
  const { error: insErr, count } = await supabase
    .from("bank_statement_lines")
    .upsert(linhasComFitid, { onConflict: "fitid", ignoreDuplicates: true, count: "exact" });
  if (insErr) {
    await supabase.from("bank_statement_imports").delete().eq("id", imp.id);
    return { ok: false as const, erro: insErr.message };
  }

  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: user.profile?.unit_id ?? null,
    acao: "extrato.importado",
    entidade: "bank_statement_imports",
    entidade_id: imp.id,
    valores_posteriores: { arquivo: input.nomeArquivo, linhas: parsed.linhas.length },
    origem: "erp",
  });

  revalidatePath("/financeiro/conciliacao");
  return { ok: true as const, importId: imp.id, totalLidas: parsed.linhas.length, novas: count ?? 0 };
}

export async function conciliarLinha(input: { linhaId: string; matchTipo: "payable" | "receivable" | "cash_movement" | "manual"; matchId: string | null }) {
  const user = await requirePermission("finance.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_statement_lines")
    .update({ conciliado: true, match_tipo: input.matchTipo, match_id: input.matchId })
    .eq("id", input.linhaId);
  if (error) return { ok: false as const, erro: error.message };

  await supabase.from("audit_events").insert({
    user_id: user.id,
    acao: "extrato.linha_conciliada",
    entidade: "bank_statement_lines",
    entidade_id: input.linhaId,
    valores_posteriores: { match_tipo: input.matchTipo, match_id: input.matchId },
    origem: "erp",
  });

  revalidatePath("/financeiro/conciliacao");
  return { ok: true as const };
}

export async function desconciliarLinha(linhaId: string) {
  await requirePermission("finance.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_statement_lines")
    .update({ conciliado: false, match_tipo: null, match_id: null })
    .eq("id", linhaId);
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/financeiro/conciliacao");
  return { ok: true as const };
}
