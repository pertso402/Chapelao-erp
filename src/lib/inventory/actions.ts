"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

// Registra um movimento de estoque. quantidade informada é magnitude positiva;
// o sinal é aplicado pelo tipo (entrada +, saída/perda −).
export async function registrarMovimento(input: {
  item_id: string;
  tipo: "entrada" | "saida" | "perda";
  quantidade: number;
  motivo?: string;
}) {
  const user = await requirePermission("inventory.manage");
  const qtd = Math.abs(Number(input.quantidade));
  if (!qtd || qtd <= 0) return { ok: false as const, erro: "Quantidade inválida." };
  if ((input.tipo === "saida" || input.tipo === "perda") && !input.motivo?.trim())
    return { ok: false as const, erro: "Justificativa obrigatória para saída/perda." };

  const sinal = input.tipo === "entrada" ? 1 : -1;
  const supabase = await createClient();

  const { error } = await supabase.from("stock_movements").insert({
    item_id: input.item_id,
    tipo: input.tipo,
    quantidade: qtd * sinal,
    motivo: input.motivo?.trim() || null,
    created_by: user.id,
  });
  if (error) return { ok: false as const, erro: error.message };

  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: user.profile?.unit_id ?? null,
    acao: "estoque.movimento",
    entidade: "inventory_items",
    entidade_id: input.item_id,
    valores_posteriores: { tipo: input.tipo, quantidade: qtd * sinal },
    justificativa: input.motivo?.trim() || null,
    origem: "erp",
  });

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${input.item_id}`);
  return { ok: true as const };
}

export async function criarItemEstoque(input: {
  nome: string;
  categoria?: string;
  measure_id?: string;
  estoque_minimo?: number;
  custo_atual?: number;
  entrada_inicial?: number;
}) {
  const user = await requirePermission("inventory.manage");
  if (!input.nome?.trim()) return { ok: false as const, erro: "Informe o nome do item." };
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("inventory_items")
    .insert({
      nome: input.nome.trim(),
      categoria: input.categoria?.trim() || null,
      measure_id: input.measure_id || null,
      estoque_minimo: Number(input.estoque_minimo ?? 0),
      custo_atual: Number(input.custo_atual ?? 0),
      unit_id: user.profile?.unit_id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, erro: error.message };

  const ent = Number(input.entrada_inicial ?? 0);
  if (ent > 0) {
    await supabase.from("stock_movements").insert({
      item_id: item.id,
      tipo: "entrada",
      quantidade: ent,
      custo_unitario: Number(input.custo_atual ?? 0),
      motivo: "Estoque inicial",
      created_by: user.id,
    });
  }

  revalidatePath("/estoque");
  return { ok: true as const, id: item.id };
}

// Ajuste de inventário: informa a quantidade contada e o sistema gera o
// movimento de ajuste pela diferença (saldo passa a bater com a contagem).
export async function ajustarInventario(input: { item_id: string; qtd_contada: number; saldo_sistema: number }) {
  const user = await requirePermission("inventory.manage");
  const diff = Number((Number(input.qtd_contada) - Number(input.saldo_sistema)).toFixed(3));
  if (diff === 0) return { ok: true as const, ajustado: false };
  const supabase = await createClient();

  const { error } = await supabase.from("stock_movements").insert({
    item_id: input.item_id,
    tipo: "inventario",
    quantidade: diff,
    motivo: `Ajuste de inventário (contado ${input.qtd_contada}, sistema ${input.saldo_sistema})`,
    created_by: user.id,
  });
  if (error) return { ok: false as const, erro: error.message };

  await supabase.from("audit_events").insert({
    user_id: user.id,
    acao: "estoque.inventario",
    entidade: "inventory_items",
    entidade_id: input.item_id,
    valores_posteriores: { diferenca: diff },
    origem: "erp",
  });

  revalidatePath("/estoque");
  return { ok: true as const, ajustado: true };
}
