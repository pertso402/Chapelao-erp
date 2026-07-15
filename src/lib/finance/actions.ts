"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

// Cria uma despesa avulsa (conta a pagar não vinculada a compra).
export async function criarDespesa(input: {
  descricao: string;
  valor: number;
  vencimento?: string | null;
  account_id?: string | null;
  cost_center_id?: string | null;
  recorrente?: boolean;
}) {
  const user = await requirePermission("finance.manage");
  if (!input.descricao?.trim()) return { ok: false as const, erro: "Informe a descrição." };
  if (!Number(input.valor) || Number(input.valor) <= 0) return { ok: false as const, erro: "Valor inválido." };
  const supabase = await createClient();

  const { error } = await supabase.from("payables").insert({
    unit_id: user.profile?.unit_id ?? null,
    descricao: input.descricao.trim(),
    valor: Number(input.valor),
    vencimento: input.vencimento || null,
    account_id: input.account_id || null,
    cost_center_id: input.cost_center_id || null,
    recorrente: !!input.recorrente,
    status: "pendente",
  });
  if (error) return { ok: false as const, erro: error.message };

  await supabase.from("audit_events").insert({
    user_id: user.id, unit_id: user.profile?.unit_id ?? null,
    acao: "despesa.criada", entidade: "payables", entidade_id: null,
    valores_posteriores: { descricao: input.descricao.trim(), valor: Number(input.valor) }, origem: "erp",
  });

  revalidatePath("/financeiro");
  return { ok: true as const };
}
