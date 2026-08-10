"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { parseNfeXml, normalizarNome, type NfeParsed } from "@/lib/purchasing/nfe";
import { confirmarCompra } from "@/lib/purchasing/actions";

export type ItemPreview = {
  codigo: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  unidade: string;
  inventoryItemIdSugerido: string | null;
  inventoryItemNomeSugerido: string | null;
};

export type PreviewXml = {
  nfe: NfeParsed;
  fornecedorEncontrado: { id: string; nome: string } | null;
  itens: ItemPreview[];
};

// Lê o XML e sugere casamentos com o estoque — NÃO grava nada no banco.
// O usuário sempre confere/ajusta antes de confirmar.
export async function preVisualizarXml(xmlText: string): Promise<{ ok: true; preview: PreviewXml } | { ok: false; erro: string }> {
  await requirePermission("purchasing.manage");
  const parsed = parseNfeXml(xmlText);
  if (!parsed.ok) return { ok: false, erro: parsed.erro };

  const supabase = await createClient();
  const cnpj = parsed.data.fornecedor.cnpj;

  const [{ data: fornecedor }, { data: itensEstoque }] = await Promise.all([
    cnpj ? supabase.from("suppliers").select("id, nome").eq("cnpj", cnpj).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("inventory_items").select("id, nome").eq("ativo", true),
  ]);

  const itens: ItemPreview[] = parsed.data.itens.map((it) => {
    const alvo = normalizarNome(it.nome);
    let match = (itensEstoque ?? []).find((e) => normalizarNome(e.nome) === alvo);
    if (!match) {
      match = (itensEstoque ?? []).find((e) => {
        const en = normalizarNome(e.nome);
        return en.includes(alvo) || alvo.includes(en);
      });
    }
    return {
      ...it,
      inventoryItemIdSugerido: match?.id ?? null,
      inventoryItemNomeSugerido: match?.nome ?? null,
    };
  });

  return {
    ok: true,
    preview: {
      nfe: parsed.data,
      fornecedorEncontrado: fornecedor ? { id: fornecedor.id, nome: fornecedor.nome } : null,
      itens,
    },
  };
}

export type ItemConfirmado = {
  nome: string;
  quantidade: number;
  valorUnitario: number;
  unidade: string;
  inventoryItemId: string | null; // null = criar item novo com este nome
};

// Confirma a importação: cria fornecedor/itens de estoque que faltarem,
// anexa o XML original e delega a criação da compra ao mesmo fluxo manual
// (confirmarCompra) — entrada no estoque + custo + conta a pagar.
export async function confirmarImportacaoXml(input: {
  xmlText: string;
  xmlNomeArquivo: string;
  fornecedorId: string | null;
  fornecedorCnpj: string;
  fornecedorNome: string;
  vencimento: string | null;
  itens: ItemConfirmado[];
}) {
  const user = await requirePermission("purchasing.manage");
  if (input.itens.length === 0) return { ok: false as const, erro: "Nenhum item para importar." };
  const supabase = await createClient();

  // 1) fornecedor: usa o encontrado ou cria um novo pelo CNPJ da nota.
  let supplierId = input.fornecedorId;
  if (!supplierId) {
    const { data: novo, error } = await supabase
      .from("suppliers")
      .insert({ nome: input.fornecedorNome, cnpj: input.fornecedorCnpj || null })
      .select("id")
      .single();
    if (error) return { ok: false as const, erro: `Fornecedor: ${error.message}` };
    supplierId = novo.id;
  }

  // 2) itens sem correspondência no estoque: cria (custo definido na própria nota).
  const { data: unidades } = await supabase.from("measurement_units").select("id, sigla");
  const idPorSigla = new Map((unidades ?? []).map((u) => [u.sigla.toLowerCase(), u.id]));
  const unUn = idPorSigla.get("un");

  const itensFinal: { inventory_item_id: string; nome: string; quantidade: number; custo_unitario: number }[] = [];
  for (const it of input.itens) {
    let itemId = it.inventoryItemId;
    if (!itemId) {
      const measureId = idPorSigla.get(it.unidade.toLowerCase()) ?? unUn ?? null;
      const { data: criado, error } = await supabase
        .from("inventory_items")
        .insert({ nome: it.nome, measure_id: measureId, categoria: "Importado NF-e", estoque_minimo: 0, custo_atual: 0 })
        .select("id")
        .single();
      if (error) return { ok: false as const, erro: `Item "${it.nome}": ${error.message}` };
      itemId = criado.id;
    }
    itensFinal.push({ inventory_item_id: itemId, nome: it.nome, quantidade: it.quantidade, custo_unitario: it.valorUnitario });
  }

  // 3) anexa o XML original no Storage.
  const path = `${crypto.randomUUID()}/${input.xmlNomeArquivo}`;
  const { error: upErr } = await supabase.storage
    .from("compras-documentos")
    .upload(path, new Blob([input.xmlText], { type: "text/xml" }));
  if (upErr) return { ok: false as const, erro: `Anexo: ${upErr.message}` };

  // 4) delega ao mesmo fluxo da compra manual (estoque + custo + conta a pagar).
  const r = await confirmarCompra({
    supplier_id: supplierId,
    vencimento: input.vencimento,
    observacao: "Importado de XML de NF-e",
    itens: itensFinal.map((i) => ({ inventory_item_id: i.inventory_item_id, nome: i.nome, quantidade: i.quantidade, custo_unitario: i.custo_unitario })),
    anexo_path: path,
    anexo_nome: input.xmlNomeArquivo,
  });
  if (!r.ok) return r;

  await supabase.from("audit_events").insert({
    user_id: user.id,
    acao: "compra.importada_xml",
    entidade: "purchases",
    valores_posteriores: { fornecedor: input.fornecedorNome, total: r.total },
    origem: "erp",
  });

  return r;
}
