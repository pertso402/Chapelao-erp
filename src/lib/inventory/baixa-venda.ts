"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

// Dá baixa no estoque dos ingredientes (ficha técnica) de um pedido vendido.
// Idempotente: o banco marca pedidos.estoque_baixado e recusa baixa dupla.
export async function baixarEstoquePedido(pedidoId: string) {
  const user = await requirePermission("pdv.use");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("baixar_estoque_pedido", {
    p_pedido_id: pedidoId,
    p_user: user.id,
  });
  if (error) return { ok: false as const, erro: error.message };

  const res = (data ?? {}) as { ok?: boolean; erro?: string; movimentos?: number };
  if (!res.ok) return { ok: false as const, erro: res.erro ?? "Não foi possível dar baixa." };

  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: user.profile?.unit_id ?? null,
    acao: "estoque.baixa_venda",
    entidade: "pedidos",
    entidade_id: pedidoId,
    valores_posteriores: { movimentos: res.movimentos },
    origem: "erp",
  });

  revalidatePath("/pedidos");
  revalidatePath("/estoque");
  return { ok: true as const, movimentos: res.movimentos ?? 0 };
}
