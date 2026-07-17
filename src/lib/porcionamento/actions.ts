"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import {
  getItensAtivosEfetivos,
  labelTipo,
  listarCatalogoPorcionamento,
  type Tamanho,
} from "@/lib/porcionamento/queries";

// Função 1 — grava a lista completa de itens ativos de hoje de uma vez
// (cada item do catálogo recebe uma linha ativo=true/false).
export async function salvarItensDoDia(ativosHoje: string[]) {
  await requirePermission("porcionamento.operar");
  const supabase = await createClient();
  const catalogo = await listarCatalogoPorcionamento();
  const ativosSet = new Set(ativosHoje);
  const hoje = new Date().toISOString().slice(0, 10);

  const rows = catalogo.map((item) => ({
    data: hoje,
    inventory_item_id: item.id,
    ativo: ativosSet.has(item.id),
  }));

  const { error } = await supabase
    .from("itens_do_dia")
    .upsert(rows, { onConflict: "data,inventory_item_id" });
  if (error) return { ok: false as const, erro: error.message };

  revalidatePath("/porcionamento");
  revalidatePath("/porcionamento/comanda");
  return { ok: true as const };
}

// Função 2.A — upsert de uma célula da grade (tamanho x item).
export async function salvarQuantidadeConfig(input: {
  tamanho: Tamanho;
  inventoryItemId: string;
  quantidade: number;
}) {
  await requirePermission("porcionamento.configurar");
  const supabase = await createClient();
  const qtd = Number(input.quantidade);

  if (!qtd || qtd <= 0) {
    const { error } = await supabase
      .from("config_porcionamento")
      .delete()
      .eq("tamanho", input.tamanho)
      .eq("inventory_item_id", input.inventoryItemId);
    if (error) return { ok: false as const, erro: error.message };
    revalidatePath("/porcionamento/configurar");
    return { ok: true as const };
  }

  const { error } = await supabase.from("config_porcionamento").upsert(
    {
      tamanho: input.tamanho,
      inventory_item_id: input.inventoryItemId,
      quantidade: qtd,
      ativo: true,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "tamanho,inventory_item_id" },
  );
  if (error) return { ok: false as const, erro: error.message };

  revalidatePath("/porcionamento/configurar");
  return { ok: true as const };
}

const ORDEM_CATEGORIA: Record<string, number> = { carne: 0, base: 1, acompanhamento: 2 };

// Função 2.B — cruza itens ativos hoje com a configuração do tamanho, grava o
// snapshot da comanda e devolve a lista pronta pra impressão térmica.
export async function imprimirComanda(tamanho: Tamanho) {
  const user = await requirePermission("porcionamento.operar");
  const supabase = await createClient();

  const [catalogo, { ativos }] = await Promise.all([
    listarCatalogoPorcionamento(),
    getItensAtivosEfetivos(),
  ]);

  const { data: configRows } = await supabase
    .from("config_porcionamento")
    .select("inventory_item_id, quantidade, ativo")
    .eq("tamanho", tamanho)
    .eq("ativo", true)
    .gt("quantidade", 0);

  const configMap = new Map((configRows ?? []).map((r) => [r.inventory_item_id, Number(r.quantidade)]));

  const itens = catalogo
    .filter((item) => ativos.has(item.id) && configMap.has(item.id))
    .map((item) => {
      const quantidade = configMap.get(item.id)!;
      return {
        item_id: item.id,
        nome: item.nome,
        quantidade,
        unidade: labelTipo(item.tipo),
        custo_estimado: item.custoPorPorcao !== null ? Number((item.custoPorPorcao * quantidade).toFixed(4)) : null,
      };
    })
    .sort((a, b) => {
      const catA = catalogo.find((c) => c.id === a.item_id)!.categoria;
      const catB = catalogo.find((c) => c.id === b.item_id)!.categoria;
      return ORDEM_CATEGORIA[catA] - ORDEM_CATEGORIA[catB];
    });

  if (itens.length === 0) {
    return { ok: false as const, erro: "Nenhum item ativo hoje tem configuração para este tamanho." };
  }

  const custoTotal = itens.reduce((s, i) => s + (i.custo_estimado ?? 0), 0);

  const { error } = await supabase.from("comandas_impressas").insert({
    tamanho,
    itens_snapshot: itens,
    custo_total_estimado: Number(custoTotal.toFixed(2)),
    atendente_id: user.id,
    atendente_nome: user.profile?.nome ?? user.email,
  });
  if (error) return { ok: false as const, erro: error.message };

  return {
    ok: true as const,
    tamanho,
    itens: itens.map((i) => ({ nome: i.nome, quantidade: i.quantidade, unidade: i.unidade })),
    custoTotalEstimado: custoTotal,
    geradoEm: new Date().toISOString(),
  };
}
