import { describe, it, expect } from "vitest";
import { parseOfx, parseCsv, parseExtrato, detectarFormato, fingerprint } from "./bank-statement";

describe("parseOfx", () => {
  const ofx = `OFXHEADER:100
DATA:OFXSGML
VERSION:102

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260805120000
<TRNAMT>-45.90
<FITID>OFXTEST0001
<NAME>PADARIA CENTRAL
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260806120000
<TRNAMT>300.00
<FITID>OFXTEST0002
<NAME>TRANSFERENCIA RECEBIDA
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  it("lê as duas transações com data, valor e nome corretos", () => {
    const r = parseOfx(ofx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.linhas).toHaveLength(2);
    expect(r.linhas[0]).toMatchObject({ data: "2026-08-05", valor: -45.9, descricao: "PADARIA CENTRAL", fitid: "OFXTEST0001" });
    expect(r.linhas[1]).toMatchObject({ data: "2026-08-06", valor: 300, descricao: "TRANSFERENCIA RECEBIDA", fitid: "OFXTEST0002" });
  });

  it("retorna erro para OFX sem transações", () => {
    const r = parseOfx("<OFX><BANKMSGSRSV1></BANKMSGSRSV1></OFX>");
    expect(r.ok).toBe(false);
  });
});

describe("parseCsv", () => {
  it("lê CSV com delimitador ; e valor em formato BR (1.234,56)", () => {
    const csv = "Data;Historico;Valor\n09/08/2026;PAGTO CONTA DE LUZ;-187,45\n10/08/2026;PIX RECEBIDO JOAO;250,00\n";
    const r = parseCsv(csv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.linhas).toHaveLength(2);
    expect(r.linhas[0]).toMatchObject({ data: "2026-08-09", valor: -187.45, descricao: "PAGTO CONTA DE LUZ" });
    expect(r.linhas[1]).toMatchObject({ data: "2026-08-10", valor: 250, descricao: "PIX RECEBIDO JOAO" });
  });

  it("lê CSV com delimitador , e valor em ponto decimal (sem ambiguidade com o delimitador)", () => {
    const csv = "Data,Descricao,Valor\n2026-08-01,Recebimento grande,1234.56\n";
    const r = parseCsv(csv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.linhas[0]).toMatchObject({ data: "2026-08-01", valor: 1234.56 });
  });

  it("retorna erro quando faltam colunas de data ou valor", () => {
    const r = parseCsv("Nome;Descricao\nJoao;Teste\n");
    expect(r.ok).toBe(false);
  });

  it("retorna erro para CSV vazio", () => {
    const r = parseCsv("Data;Valor\n");
    expect(r.ok).toBe(false);
  });
});

describe("detectarFormato", () => {
  it("detecta OFX pela extensão", () => {
    expect(detectarFormato("extrato.OFX", "qualquer coisa")).toBe("ofx");
  });
  it("detecta OFX pelo conteúdo mesmo sem extensão .ofx", () => {
    expect(detectarFormato("extrato.txt", "<OFX><STMTTRN></STMTTRN></OFX>")).toBe("ofx");
  });
  it("assume CSV como default", () => {
    expect(detectarFormato("extrato.csv", "Data;Valor\n2026-01-01;10")).toBe("csv");
  });
});

describe("parseExtrato", () => {
  it("propaga erro de parse sem lançar exceção", () => {
    const r = parseExtrato("vazio.csv", "");
    expect(r.ok).toBe(false);
  });
});

describe("fingerprint", () => {
  it("é determinístico para a mesma linha", async () => {
    const linha = { data: "2026-08-09", descricao: "Teste", valor: -10, fitid: null };
    const a = await fingerprint(linha);
    const b = await fingerprint(linha);
    expect(a).toBe(b);
  });

  it("muda se qualquer campo mudar", async () => {
    const a = await fingerprint({ data: "2026-08-09", descricao: "Teste", valor: -10, fitid: null });
    const b = await fingerprint({ data: "2026-08-09", descricao: "Teste", valor: -11, fitid: null });
    expect(a).not.toBe(b);
  });
});
