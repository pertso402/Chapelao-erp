"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

// Muda o status de um pedido. O histórico é gravado por trigger no banco.
// Registra também um evento de auditoria com o usuário do ERP.
export async function mudarStatusPedido(pedidoId: string, novoStatus: string) {
  const user = await requirePermission("orders.manage");
  const supabase = await createClient();

  const { data: antes } = await supabase
    .from("pedidos")
    .select("status")
    .eq("id", pedidoId)
    .maybeSingle();

  const { error } = await supabase
    .from("pedidos")
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) return { ok: false, erro: error.message };

  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: user.profile?.unit_id ?? null,
    acao: "pedido.status",
    entidade: "pedidos",
    entidade_id: pedidoId,
    valores_anteriores: { status: antes?.status ?? null },
    valores_posteriores: { status: novoStatus },
    origem: "erp",
  });

  revalidatePath("/pedidos");
  return { ok: true };
}

// Cancela um pedido exigindo justificativa; registra o cancelamento e a auditoria.
export async function cancelarPedido(pedidoId: string, motivo: string) {
  const user = await requirePermission("orders.manage");
  if (!motivo?.trim()) return { ok: false, erro: "Justificativa obrigatória." };
  const supabase = await createClient();

  const { data: ped } = await supabase
    .from("pedidos")
    .select("status, total")
    .eq("id", pedidoId)
    .maybeSingle();

  const { error } = await supabase
    .from("pedidos")
    .update({ status: "cancelado", updated_at: new Date().toISOString() })
    .eq("id", pedidoId);
  if (error) return { ok: false, erro: error.message };

  await supabase.from("order_cancellations").insert({
    pedido_id: pedidoId,
    motivo: motivo.trim(),
    valor_estornado: Number(ped?.total ?? 0),
    cancelado_por: user.id,
  });

  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: user.profile?.unit_id ?? null,
    acao: "pedido.cancelamento",
    entidade: "pedidos",
    entidade_id: pedidoId,
    valores_anteriores: { status: ped?.status ?? null },
    valores_posteriores: { status: "cancelado" },
    justificativa: motivo.trim(),
    origem: "erp",
  });

  revalidatePath("/pedidos");
  return { ok: true };
}
