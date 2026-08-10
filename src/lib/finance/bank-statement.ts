// Leitura DETERMINÍSTICA de extrato bancário (OFX ou CSV) — sem Open Finance,
// sem API de banco. Só interpreta o arquivo que o usuário já exportou do
// internet banking. Nada é gravado automaticamente: quem chama decide o que
// fazer com as linhas (ver conciliacao-actions.ts).

export type LinhaExtratoLida = {
  data: string; // AAAA-MM-DD
  descricao: string;
  valor: number; // positivo = crédito (entrada), negativo = débito (saída)
  fitid: string | null;
};

function soData(v: string): string | null {
  // OFX: AAAAMMDD[HHMMSS][.mmm][+TZ]
  const m = v.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

export function parseOfx(texto: string): { ok: true; linhas: LinhaExtratoLida[] } | { ok: false; erro: string } {
  const blocos = texto.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi) ?? texto.split(/<STMTTRN>/i).slice(1).map((b) => b.split(/<\/STMTTRN>/i)[0]);
  if (!blocos || blocos.length === 0) return { ok: false, erro: "Nenhuma transação (<STMTTRN>) encontrada no OFX." };

  const campo = (bloco: string, tag: string): string | null => {
    const m = bloco.match(new RegExp(`<${tag}>([^<\r\n]*)`, "i"));
    return m ? m[1].trim() : null;
  };

  const linhas: LinhaExtratoLida[] = [];
  for (const bloco of blocos) {
    const dtRaw = campo(bloco, "DTPOSTED");
    const valorRaw = campo(bloco, "TRNAMT");
    const nome = campo(bloco, "NAME") ?? campo(bloco, "MEMO") ?? "Movimentação";
    const fitid = campo(bloco, "FITID");
    if (!dtRaw || valorRaw == null) continue;
    const data = soData(dtRaw);
    const valor = Number(valorRaw);
    if (!data || !Number.isFinite(valor)) continue;
    linhas.push({ data, descricao: nome, valor, fitid });
  }
  if (linhas.length === 0) return { ok: false, erro: "OFX lido, mas nenhuma linha válida (data/valor)." };
  return { ok: true, linhas };
}

function splitCsvLine(linha: string, delim: string): string[] {
  return linha.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));
}

function parseValorBr(s: string): number {
  const limpo = s.replace(/\s/g, "").replace(/R\$/i, "");
  // "1.234,56" -> 1234.56 ; "1234.56" -> 1234.56 ; "-50,00" -> -50
  if (/,\d{1,2}$/.test(limpo)) {
    return Number(limpo.replace(/\./g, "").replace(",", "."));
  }
  return Number(limpo.replace(/,/g, ""));
}

function soDataCsv(s: string): string | null {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

export function parseCsv(texto: string): { ok: true; linhas: LinhaExtratoLida[] } | { ok: false; erro: string } {
  const linhasArquivo = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhasArquivo.length < 2) return { ok: false, erro: "CSV vazio ou sem linhas de dados." };

  const delim = linhasArquivo[0].includes(";") ? ";" : ",";
  const header = splitCsvLine(linhasArquivo[0], delim).map((h) => h.toLowerCase());

  const idxData = header.findIndex((h) => /data|date/.test(h));
  const idxDesc = header.findIndex((h) => /descri|historic|memo|lancamento|lançamento/.test(h));
  const idxValor = header.findIndex((h) => /valor|amount/.test(h));

  if (idxData === -1 || idxValor === -1) {
    return { ok: false, erro: "CSV precisa ter colunas de data e valor (ex.: Data, Descrição, Valor)." };
  }

  const linhas: LinhaExtratoLida[] = [];
  for (let i = 1; i < linhasArquivo.length; i++) {
    const campos = splitCsvLine(linhasArquivo[i], delim);
    if (campos.length <= idxValor) continue;
    const data = soDataCsv(campos[idxData]);
    const valor = parseValorBr(campos[idxValor]);
    if (!data || !Number.isFinite(valor)) continue;
    const descricao = idxDesc >= 0 ? campos[idxDesc] : "Movimentação";
    linhas.push({ data, descricao: descricao || "Movimentação", valor, fitid: null });
  }
  if (linhas.length === 0) return { ok: false, erro: "CSV lido, mas nenhuma linha válida encontrada." };
  return { ok: true, linhas };
}

export function detectarFormato(nomeArquivo: string, texto: string): "ofx" | "csv" {
  if (/\.ofx$/i.test(nomeArquivo) || /<OFX>/i.test(texto)) return "ofx";
  return "csv";
}

export function parseExtrato(nomeArquivo: string, texto: string): { ok: true; formato: "ofx" | "csv"; linhas: LinhaExtratoLida[] } | { ok: false; erro: string } {
  const formato = detectarFormato(nomeArquivo, texto);
  const r = formato === "ofx" ? parseOfx(texto) : parseCsv(texto);
  if (!r.ok) return r;
  return { ok: true, formato, linhas: r.linhas };
}

// Fingerprint estável para deduplicar linhas sem FITID (CSV) em reimportações.
export async function fingerprint(l: LinhaExtratoLida): Promise<string> {
  const base = `${l.data}|${l.valor.toFixed(2)}|${l.descricao.trim().toLowerCase()}`;
  const enc = new TextEncoder().encode(base);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
