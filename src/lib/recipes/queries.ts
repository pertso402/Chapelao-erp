import { createClient } from "@/lib/supabase/server";

// Mapa produto_id → custo. Duas fontes:
// 1) Produtos PREPARADOS (têm ficha técnica): custo = soma dos ingredientes (v_recipe_cost).
// 2) Produtos de REVENDA (vinculados 1:1 a um item de estoque): custo = custo_atual do item.
// Retorna também se o custo é 0 "de verdade" (revenda sem compra registrada ainda).
export async function custoPorProduto(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const [{ data: recipes }, { data: custos }, { data: produtos }] = await Promise.all([
    supabase.from("recipes").select("id, produto_id"),
    supabase.from("v_recipe_cost").select("recipe_id, custo_porcao"),
    supabase.from("produtos").select("id, inventory_item_id").not("inventory_item_id", "is", null),
  ]);

  const custoPorRecipe = new Map((custos ?? []).map((c) => [c.recipe_id, Number(c.custo_porcao)]));
  const m = new Map<string, number>();
  for (const r of recipes ?? []) {
    const c = custoPorRecipe.get(r.id);
    if (c != null) m.set(r.produto_id, c);
  }

  const itemIds = [...new Set((produtos ?? []).map((p) => p.inventory_item_id).filter(Boolean))] as string[];
  if (itemIds.length) {
    const { data: itens } = await supabase.from("inventory_items").select("id, custo_atual").in("id", itemIds);
    const custoPorItem = new Map((itens ?? []).map((i) => [i.id, Number(i.custo_atual)]));
    for (const p of produtos ?? []) {
      if (m.has(p.id)) continue; // ficha técnica tem prioridade
      const c = p.inventory_item_id ? custoPorItem.get(p.inventory_item_id) : undefined;
      if (c != null) m.set(p.id, c);
    }
  }

  return m;
}

// Produtos ainda sem NENHUM rastreamento de custo (nem ficha, nem vínculo de estoque).
export async function contarProdutosSemCusto(): Promise<number> {
  const supabase = await createClient();
  const { data: produtos } = await supabase.from("produtos").select("id, inventory_item_id").eq("disponivel", true);
  const { data: recipes } = await supabase.from("recipes").select("produto_id");
  const comFicha = new Set((recipes ?? []).map((r) => r.produto_id));
  return (produtos ?? []).filter((p) => !p.inventory_item_id && !comFicha.has(p.id)).length;
}

export type FichaItem = {
  recipe_item_id: string;
  inventory_item_id: string;
  nome: string;
  sigla: string;
  quantidade: number;
  custo_unit: number;
  subtotal: number;
};

export type Ficha = {
  produto: { id: string; nome: string; preco: number };
  recipe_id: string | null;
  version_id: string | null;
  itens: FichaItem[];
  custo: number;
};

export async function getFichaDoProduto(produtoId: string): Promise<Ficha | null> {
  const supabase = await createClient();
  const { data: produto } = await supabase
    .from("produtos")
    .select("id, nome, preco, preco_promocional")
    .eq("id", produtoId)
    .maybeSingle();
  if (!produto) return null;

  const preco = produto.preco_promocional != null ? Number(produto.preco_promocional) : Number(produto.preco);

  const { data: recipe } = await supabase.from("recipes").select("id").eq("produto_id", produtoId).maybeSingle();
  if (!recipe) {
    return { produto: { id: produto.id, nome: produto.nome, preco }, recipe_id: null, version_id: null, itens: [], custo: 0 };
  }

  const { data: version } = await supabase
    .from("recipe_versions")
    .select("id")
    .eq("recipe_id", recipe.id)
    .eq("ativa", true)
    .maybeSingle();

  const itens: FichaItem[] = [];
  if (version) {
    const { data: ris } = await supabase
      .from("recipe_items")
      .select("id, inventory_item_id, quantidade, inventory_items(nome, custo_atual, measure_id)")
      .eq("version_id", version.id);

    const measureIds = [...new Set((ris ?? []).map((r) => (r.inventory_items as unknown as { measure_id: string | null })?.measure_id).filter(Boolean))] as string[];
    const { data: medidas } = measureIds.length
      ? await supabase.from("measurement_units").select("id, sigla").in("id", measureIds)
      : { data: [] };
    const siglaPorId = new Map((medidas ?? []).map((m) => [m.id, m.sigla]));

    for (const r of ris ?? []) {
      const inv = r.inventory_items as unknown as { nome: string; custo_atual: number; measure_id: string | null };
      const custo = Number(inv.custo_atual);
      const qtd = Number(r.quantidade);
      itens.push({
        recipe_item_id: r.id,
        inventory_item_id: r.inventory_item_id,
        nome: inv.nome,
        sigla: inv.measure_id ? siglaPorId.get(inv.measure_id) ?? "" : "",
        quantidade: qtd,
        custo_unit: custo,
        subtotal: Number((qtd * custo).toFixed(4)),
      });
    }
  }

  const custo = itens.reduce((s, i) => s + i.subtotal, 0);
  return { produto: { id: produto.id, nome: produto.nome, preco }, recipe_id: recipe.id, version_id: version?.id ?? null, itens, custo };
}

// CMV teórico do mês: soma, para cada item de pedido vendido, do custo da ficha do produto.
export async function cmvTeoricoMes(): Promise<{ cmv: number; receita: number }> {
  const supabase = await createClient();
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);

  const [{ data: itens }, custos] = await Promise.all([
    supabase
      .from("itens_pedido")
      .select("produto_id, quantidade, total, pedidos!inner(created_at, status)")
      .gte("pedidos.created_at", inicio.toISOString()),
    custoPorProduto(),
  ]);

  let cmv = 0, receita = 0;
  for (const it of (itens ?? []) as unknown as { produto_id: string | null; quantidade: number; total: number; pedidos: { status: string | null } }[]) {
    if (it.pedidos?.status && /cancel/i.test(it.pedidos.status)) continue;
    receita += Number(it.total ?? 0);
    if (it.produto_id && custos.has(it.produto_id)) {
      cmv += custos.get(it.produto_id)! * Number(it.quantidade ?? 0);
    }
  }
  return { cmv: Number(cmv.toFixed(2)), receita: Number(receita.toFixed(2)) };
}
