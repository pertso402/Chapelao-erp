import { createClient } from "@/lib/supabase/server";
import type { ConfigPorcionamento, ItemCatalogo, Tamanho } from "@/lib/porcionamento/shared";

export type { Tamanho, ItemCatalogo, ConfigPorcionamento };
export { labelTipo, TETO_CMV } from "@/lib/porcionamento/shared";

export async function listarCatalogoPorcionamento(): Promise<ItemCatalogo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_items")
    .select("id, nome, custo_atual, porc_categoria, porc_subcategoria, porc_tipo, porc_peso_g, porc_custo_por_porcao")
    .eq("porc_ativo", true)
    .eq("ativo", true)
    .order("porc_categoria")
    .order("nome");

  return (data ?? []).map((i) => ({
    id: i.id,
    nome: i.nome,
    categoria: i.porc_categoria as ItemCatalogo["categoria"],
    subcategoria: i.porc_subcategoria,
    tipo: i.porc_tipo as ItemCatalogo["tipo"],
    pesoG: i.porc_peso_g === null ? null : Number(i.porc_peso_g),
    custoPorPorcao: i.porc_custo_por_porcao === null ? null : Number(i.porc_custo_por_porcao),
    pendentePeso: i.porc_peso_g === null,
    pendentePreco: Number(i.custo_atual) === 0,
  }));
}

// Itens ativos "hoje". Se ninguém configurou ainda, cai para o último dia
// configurado — nunca lista vazia (evita a Função 2 ficar sem itens pra
// imprimir por esquecimento operacional, conforme a especificação).
export async function getItensAtivosEfetivos(): Promise<{
  data: string;
  ativos: Set<string>;
  isFallback: boolean;
}> {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: rowsHoje } = await supabase
    .from("itens_do_dia")
    .select("inventory_item_id, ativo")
    .eq("data", hoje);

  if (rowsHoje && rowsHoje.length > 0) {
    return {
      data: hoje,
      ativos: new Set(rowsHoje.filter((r) => r.ativo).map((r) => r.inventory_item_id)),
      isFallback: false,
    };
  }

  const { data: ultimaData } = await supabase
    .from("itens_do_dia")
    .select("data")
    .lt("data", hoje)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ultimaData) return { data: hoje, ativos: new Set(), isFallback: false };

  const { data: rowsAnteriores } = await supabase
    .from("itens_do_dia")
    .select("inventory_item_id, ativo")
    .eq("data", ultimaData.data);

  return {
    data: ultimaData.data,
    ativos: new Set((rowsAnteriores ?? []).filter((r) => r.ativo).map((r) => r.inventory_item_id)),
    isFallback: true,
  };
}

export async function listarConfigPorcionamento(): Promise<ConfigPorcionamento> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("config_porcionamento")
    .select("tamanho, inventory_item_id, quantidade, ativo");

  const config: ConfigPorcionamento = { P: {}, M: {}, G: {} };
  for (const row of data ?? []) {
    config[row.tamanho as Tamanho][row.inventory_item_id] = {
      quantidade: Number(row.quantidade),
      ativo: row.ativo,
    };
  }
  return config;
}

// Itens ativos hoje que não têm configuração (ou configuração zerada) para um
// tamanho — aviso discreto pro admin revisar lacunas, sem travar nada.
export async function getLacunasConfiguracao(): Promise<Record<Tamanho, number>> {
  const [catalogo, { ativos }, config] = await Promise.all([
    listarCatalogoPorcionamento(),
    getItensAtivosEfetivos(),
    listarConfigPorcionamento(),
  ]);

  const lacunas: Record<Tamanho, number> = { P: 0, M: 0, G: 0 };
  for (const tamanho of ["P", "M", "G"] as const) {
    for (const item of catalogo) {
      if (!ativos.has(item.id)) continue;
      const cfg = config[tamanho][item.id];
      if (!cfg || !cfg.ativo || cfg.quantidade <= 0) lacunas[tamanho]++;
    }
  }
  return lacunas;
}
