import { XMLParser } from "fast-xml-parser";

// Leitura DETERMINÍSTICA do XML da NF-e (nfeProc/NFe/infNFe) — sem IA, sem
// certificado digital, sem SEFAZ. Só interpreta o arquivo que o usuário já
// tem em mãos. O usuário sempre confere antes de confirmar (nada é gravado
// automaticamente por esta função).

export type NfeItem = {
  codigo: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  unidade: string;
};

export type NfeDuplicata = { numero: string; vencimento: string | null; valor: number };

export type NfeParsed = {
  numero: string;
  serie: string;
  chaveAcesso: string | null;
  dataEmissao: string | null;
  fornecedor: { cnpj: string; nome: string };
  itens: NfeItem[];
  valorTotal: number;
  duplicatas: NfeDuplicata[];
};

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Data no formato AAAA-MM-DD a partir de "AAAA-MM-DDTHH:MM:SS-03:00".
function soData(v: unknown): string | null {
  const s = String(v ?? "");
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

export function parseNfeXml(xmlText: string): { ok: true; data: NfeParsed } | { ok: false; erro: string } {
  let json: unknown;
  try {
    // parseTagValue desligado: campos como nNF/serie/nDup são códigos fiscais
    // (podem ter zeros à esquerda, ex. "001") — não números. Os campos que
    // são de fato quantidades/valores já passam por num() abaixo.
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", trimValues: true, parseTagValue: false });
    json = parser.parse(xmlText);
  } catch {
    return { ok: false, erro: "Arquivo XML inválido — não foi possível ler." };
  }

  const root = json as Record<string, unknown>;
  const nfeProc = (root.nfeProc ?? root.NFe ?? root) as Record<string, unknown>;
  const nfe = (nfeProc.NFe ?? nfeProc) as Record<string, unknown> | undefined;
  const infNFe = (nfe?.infNFe ?? (root as Record<string, unknown>).infNFe) as Record<string, unknown> | undefined;

  if (!infNFe) {
    return { ok: false, erro: "XML não parece ser uma NF-e (infNFe não encontrado)." };
  }

  const ide = infNFe.ide as Record<string, unknown> | undefined;
  const emit = infNFe.emit as Record<string, unknown> | undefined;
  const total = infNFe.total as Record<string, unknown> | undefined;
  const icmsTot = total?.ICMSTot as Record<string, unknown> | undefined;
  const cobr = infNFe.cobr as Record<string, unknown> | undefined;
  const dets = toArray(infNFe.det as Record<string, unknown> | Record<string, unknown>[] | undefined);

  if (!emit) return { ok: false, erro: "XML sem dados do fornecedor (emit)." };
  if (dets.length === 0) return { ok: false, erro: "XML sem itens (det)." };

  const itens: NfeItem[] = dets.map((d) => {
    const prod = (d.prod ?? d) as Record<string, unknown>;
    return {
      codigo: String(prod.cProd ?? ""),
      nome: String(prod.xProd ?? "Item sem nome"),
      quantidade: num(prod.qCom),
      valorUnitario: num(prod.vUnCom),
      valorTotal: num(prod.vProd),
      unidade: String(prod.uCom ?? "un"),
    };
  });

  const duplicatas: NfeDuplicata[] = toArray(cobr?.dup as Record<string, unknown> | Record<string, unknown>[] | undefined).map((dup) => ({
    numero: String(dup.nDup ?? ""),
    vencimento: soData(dup.dVenc),
    valor: num(dup.vDup),
  }));

  // chave de acesso: atributo Id="NFe<44 dígitos>" do próprio infNFe.
  const idAttr = String(infNFe["@_Id"] ?? "");
  const chave = idAttr.replace(/^NFe/, "") || null;

  return {
    ok: true,
    data: {
      numero: String(ide?.nNF ?? ""),
      serie: String(ide?.serie ?? ""),
      chaveAcesso: chave,
      dataEmissao: soData(ide?.dhEmi ?? ide?.dEmi),
      fornecedor: { cnpj: String(emit.CNPJ ?? "").replace(/\D/g, ""), nome: String(emit.xNome ?? "Fornecedor") },
      itens,
      valorTotal: num(icmsTot?.vNF ?? total?.vNF),
      duplicatas,
    },
  };
}

// Normalização igual à usada pelo agente (src/utils/pedido.js) — pra casar
// nomes de forma consistente com o resto do sistema.
export function normalizarNome(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
