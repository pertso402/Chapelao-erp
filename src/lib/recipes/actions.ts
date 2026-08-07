"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

// Garante que exista receita + versão ativa para o produto; retorna version_id.
async function garantirVersao(supabase: Awaited<ReturnType<typeof createClient>>, produtoId: string, nomeProduto: string) {
  let { data: recipe } = await supabase.from("recipes").select("id").eq("produto_id", produtoId).maybeSingle();
  if (!recipe) {
    const { data } = await supabase.from("recipes").insert({ produto_id: produtoId, nome: `Ficha ${nomeProduto}` }).select("id").single();
    recipe = data;
  }
  let { data: version } = await supabase.from("recipe_versions").select("id").eq("recipe_id", recipe!.id).eq("ativa", true).maybeSingle();
  if (!version) {
    const { data } = await supabase.from("recipe_versions").insert({ recipe_id: recipe!.id, versao: 1, ativa: true, rendimento: 1 }).select("id").single();
    version = data;
  }
  return version!.id;
}

export async function adicionarIngrediente(input: {
  produto_id: string;
  nome_produto: string;
  inventory_item_id: string;
  quantidade: number;
}) {
  await requirePermission("catalog.manage");
  const supabase = await createClient();
  const versionId = await garantirVersao(supabase, input.produto_id, input.nome_produto);

  // se já existe o ingrediente, soma; senão insere
  const { data: existente } = await supabase
    .from("recipe_items")
    .select("id, quantidade")
    .eq("version_id", versionId)
    .eq("inventory_item_id", input.inventory_item_id)
    .maybeSingle();

  if (existente) {
    await supabase.from("recipe_items").update({ quantidade: input.quantidade }).eq("id", existente.id);
  } else {
    await supabase.from("recipe_items").insert({ version_id: versionId, inventory_item_id: input.inventory_item_id, quantidade: input.quantidade });
  }

  revalidatePath(`/fichas/${input.produto_id}`);
  revalidatePath("/cardapio");
  return { ok: true as const };
}

export async function removerIngrediente(recipeItemId: string, produtoId: string) {
  await requirePermission("catalog.manage");
  const supabase = await createClient();
  await supabase.from("recipe_items").delete().eq("id", recipeItemId);
  revalidatePath(`/fichas/${produtoId}`);
  revalidatePath("/cardapio");
  return { ok: true as const };
}

// Vincula todos os produtos de revenda (sem ficha técnica) a um item de
// estoque 1:1, criando o item quando necessário. Custo começa em R$0 e é
// preenchido pela primeira compra registrada — nada é inventado.
export async function vincularProdutosSemCusto() {
  await requirePermission("catalog.manage");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("vincular_produtos_sem_custo");
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/cardapio");
  revalidatePath("/estoque");
  return { ok: true as const, vinculados: data ?? 0 };
}
