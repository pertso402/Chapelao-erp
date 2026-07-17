// Tipos e constantes puros do módulo de porcionamento — sem dependências de
// servidor (next/headers), pra poder ser importado por client components.

export type Tamanho = "P" | "M" | "G";

export type ItemCatalogo = {
  id: string;
  nome: string;
  categoria: "carne" | "acompanhamento" | "base";
  subcategoria: string | null;
  tipo: "concha" | "unidade" | "pedaco" | "colher";
  pesoG: number | null;
  custoPorPorcao: number | null;
  pendentePeso: boolean;
  pendentePreco: boolean;
};

export type ConfigPorcionamento = Record<Tamanho, Record<string, { quantidade: number; ativo: boolean }>>;

export const TETO_CMV: Record<Tamanho, number> = { P: 6.65, M: 7.35, G: 8.05 };

const TIPO_LABEL: Record<string, string> = {
  concha: "concha",
  unidade: "un",
  pedaco: "pedaço",
  colher: "colher",
};

export function labelTipo(tipo: string) {
  return TIPO_LABEL[tipo] ?? tipo;
}
