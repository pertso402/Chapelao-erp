"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { getCaixaAberto } from "@/lib/cash/queries";

export async function abrirCaixa(saldoInicial: number) {
  const user = await requirePermission("pdv.use");
  const supabase = await createClient();

  const { data: aberta } = await supabase.from("cash_sessions").select("id").eq("status", "aberta").maybeSingle();
  if (aberta) return { ok: false as const, erro: "Já existe um caixa aberto." };

  const { error } = await supabase.from("cash_sessions").insert({
    unit_id: user.profile?.unit_id ?? null,
    operador_id: user.id,
    status: "aberta",
    saldo_inicial: Number(saldoInicial) || 0,
  });
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/caixa");
  return { ok: true as const };
}

export async function registrarMovimentoCaixa(input: { session_id: string; tipo: "sangria" | "suprimento" | "despesa"; valor: number; motivo?: string }) {
  const user = await requirePermission("pdv.use");
  if (!Number(input.valor) || Number(input.valor) <= 0) return { ok: false as const, erro: "Valor inválido." };
  if (!input.motivo?.trim()) return { ok: false as const, erro: "Justificativa obrigatória." };
  const supabase = await createClient();

  const { error } = await supabase.from("cash_movements").insert({
    session_id: input.session_id,
    tipo: input.tipo,
    valor: Number(input.valor),
    motivo: input.motivo.trim(),
    created_by: user.id,
  });
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/caixa");
  return { ok: true as const };
}

export async function fecharCaixa(input: { contado_dinheiro: number; contado_pix: number; contado_cartao: number }) {
  const user = await requirePermission("pdv.use");
  const supabase = await createClient();

  const caixa = await getCaixaAberto();
  if (!caixa) return { ok: false as const, erro: "Não há caixa aberto." };

  const contado = {
    dinheiro: Number(input.contado_dinheiro) || 0,
    pix: Number(input.contado_pix) || 0,
    cartao: Number(input.contado_cartao) || 0,
  };
  const diferenca = {
    dinheiro: Number((contado.dinheiro - caixa.esperado.dinheiro).toFixed(2)),
    pix: Number((contado.pix - caixa.esperado.pix).toFixed(2)),
    cartao: Number((contado.cartao - caixa.esperado.cartao).toFixed(2)),
  };

  const { error } = await supabase
    .from("cash_sessions")
    .update({
      status: "fechada",
      fechada_em: new Date().toISOString(),
      fechamento: { esperado: caixa.esperado, contado, diferenca },
    })
    .eq("id", caixa.id);
  if (error) return { ok: false as const, erro: error.message };

  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: user.profile?.unit_id ?? null,
    acao: "caixa.fechamento",
    entidade: "cash_sessions",
    entidade_id: caixa.id,
    valores_posteriores: { esperado: caixa.esperado, contado, diferenca },
    origem: "erp",
  });

  revalidatePath("/caixa");
  return { ok: true as const, diferenca };
}
