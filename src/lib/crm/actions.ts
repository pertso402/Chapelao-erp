"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

export async function criarCupom(input: {
  codigo: string;
  desconto_percentual: number;
  valido_ate: string;
  descricao?: string;
  cliente_id: string;
}) {
  const user = await requirePermission("marketing.manage");
  if (!input.codigo?.trim()) return { ok: false as const, erro: "Informe o código do cupom." };
  if (!input.valido_ate) return { ok: false as const, erro: "Informe a validade." };
  if (!input.cliente_id) return { ok: false as const, erro: "Selecione o cliente do cupom." };
  const supabase = await createClient();

  const { error } = await supabase.from("cupons").insert({
    codigo: input.codigo.trim().toUpperCase(),
    tipo: "desconto_percentual",
    desconto_percentual: Math.round(Number(input.desconto_percentual) || 0),
    valido_ate: input.valido_ate,
    descricao: input.descricao?.trim() || null,
    cliente_id: input.cliente_id,
    usado: false,
  });
  if (error) return { ok: false as const, erro: error.message };

  await supabase.from("audit_events").insert({
    user_id: user.id, acao: "cupom.criado", entidade: "cupons", origem: "erp",
    valores_posteriores: { codigo: input.codigo.trim().toUpperCase() },
  });

  revalidatePath("/marketing");
  return { ok: true as const };
}

export async function marcarCupomUsado(id: string, usado: boolean) {
  await requirePermission("marketing.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("cupons").update({ usado }).eq("id", id);
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/marketing");
  return { ok: true as const };
}
