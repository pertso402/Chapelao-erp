"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

export type ProdutoInput = {
  nome: string;
  categoria?: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number | null;
  preco_delivery?: number | null;
  disponivel?: boolean;
  destaque?: boolean;
};

function validar(input: ProdutoInput): string | null {
  if (!input.nome?.trim()) return "Informe o nome do produto.";
  if (!(Number(input.preco) > 0)) return "Preço deve ser maior que zero.";
  if (input.preco_promocional != null && Number(input.preco_promocional) >= Number(input.preco)) {
    return "Preço promocional deve ser menor que o preço normal.";
  }
  if (input.preco_delivery != null && !(Number(input.preco_delivery) > 0)) {
    return "Preço de delivery deve ser maior que zero.";
  }
  return null;
}

export async function criarProduto(input: ProdutoInput) {
  await requirePermission("catalog.manage");
  const erro = validar(input);
  if (erro) return { ok: false as const, erro };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produtos")
    .insert({
      nome: input.nome.trim(),
      categoria: input.categoria?.trim() || null,
      descricao: input.descricao?.trim() || null,
      preco: Number(input.preco),
      preco_promocional: input.preco_promocional != null ? Number(input.preco_promocional) : null,
      preco_delivery: input.preco_delivery != null ? Number(input.preco_delivery) : null,
      disponivel: input.disponivel ?? true,
      destaque: input.destaque ?? false,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, erro: error.message };

  revalidatePath("/cardapio");
  return { ok: true as const, id: data.id };
}

export async function atualizarProduto(id: string, input: ProdutoInput) {
  await requirePermission("catalog.manage");
  const erro = validar(input);
  if (erro) return { ok: false as const, erro };

  const supabase = await createClient();
  const { error } = await supabase
    .from("produtos")
    .update({
      nome: input.nome.trim(),
      categoria: input.categoria?.trim() || null,
      descricao: input.descricao?.trim() || null,
      preco: Number(input.preco),
      preco_promocional: input.preco_promocional != null ? Number(input.preco_promocional) : null,
      preco_delivery: input.preco_delivery != null ? Number(input.preco_delivery) : null,
      disponivel: input.disponivel ?? true,
      destaque: input.destaque ?? false,
    })
    .eq("id", id);
  if (error) return { ok: false as const, erro: error.message };

  revalidatePath("/cardapio");
  return { ok: true as const };
}

export async function alternarDisponibilidade(id: string, disponivel: boolean) {
  await requirePermission("catalog.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("produtos").update({ disponivel }).eq("id", id);
  if (error) return { ok: false as const, erro: error.message };

  revalidatePath("/cardapio");
  return { ok: true as const };
}

export async function excluirProduto(id: string) {
  await requirePermission("catalog.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) {
    // Violação de FK (23503) = produto referenciado em ficha técnica, pedido, etc.
    if (error.code === "23503") {
      return {
        ok: false as const,
        erro: "Não é possível excluir: este produto está vinculado a uma ficha técnica ou a pedidos já feitos. Desative-o em vez de excluir.",
      };
    }
    return { ok: false as const, erro: error.message };
  }

  revalidatePath("/cardapio");
  return { ok: true as const };
}
