import { describe, it, expect } from "vitest";
import { parseNfeXml, normalizarNome } from "./nfe";

const XML_VALIDO = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe41260712345678000144550010000012345123456789" versao="4.00">
      <ide>
        <cUF>41</cUF>
        <nNF>12345</nNF>
        <serie>1</serie>
        <dhEmi>2026-08-10T09:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000144</CNPJ>
        <xNome>Distribuidora Teste XML Ltda</xNome>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>001</cProd>
          <xProd>ARROZ TIPO 1 5KG</xProd>
          <uCom>kg</uCom>
          <qCom>50.0000</qCom>
          <vUnCom>5.500000</vUnCom>
          <vProd>275.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>002</cProd>
          <xProd>REFRIGERANTE GUARANA LATA</xProd>
          <uCom>un</uCom>
          <qCom>24.0000</qCom>
          <vUnCom>2.800000</vUnCom>
          <vProd>67.20</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vNF>342.20</vNF>
        </ICMSTot>
      </total>
      <cobr>
        <dup>
          <nDup>001</nDup>
          <dVenc>2026-09-10</dVenc>
          <vDup>342.20</vDup>
        </dup>
      </cobr>
    </infNFe>
  </NFe>
</nfeProc>`;

describe("parseNfeXml", () => {
  it("lê emitente, itens, total e duplicata de uma NF-e válida", () => {
    const r = parseNfeXml(XML_VALIDO);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.numero).toBe("12345");
    expect(r.data.fornecedor).toEqual({ cnpj: "12345678000144", nome: "Distribuidora Teste XML Ltda" });
    expect(r.data.itens).toHaveLength(2);
    expect(r.data.itens[0]).toMatchObject({ nome: "ARROZ TIPO 1 5KG", quantidade: 50, valorUnitario: 5.5, unidade: "kg" });
    expect(r.data.valorTotal).toBe(342.2);
    expect(r.data.duplicatas).toEqual([{ numero: "001", vencimento: "2026-09-10", valor: 342.2 }]);
    expect(r.data.dataEmissao).toBe("2026-08-10");
  });

  it("um único <det> (não array) ainda é lido corretamente", () => {
    const xmlUmItem = XML_VALIDO.replace(
      /<det nItem="2">[\s\S]*?<\/det>\s*<total>/,
      "<total>",
    );
    const r = parseNfeXml(xmlUmItem);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.itens).toHaveLength(1);
  });

  it("rejeita XML que não é uma NF-e", () => {
    const r = parseNfeXml("<root><algumaCoisa>x</algumaCoisa></root>");
    expect(r.ok).toBe(false);
  });

  it("rejeita XML mal formado sem lançar exceção", () => {
    const r = parseNfeXml("<nfeProc><NFe><infNFe");
    expect(r.ok).toBe(false);
  });

  it("rejeita NF-e sem itens", () => {
    const semItens = XML_VALIDO.replace(/<det nItem="1">[\s\S]*?<\/det>\s*<det nItem="2">[\s\S]*?<\/det>/, "");
    const r = parseNfeXml(semItens);
    expect(r.ok).toBe(false);
  });

  it("rejeita NF-e sem dados do emitente", () => {
    const semEmit = XML_VALIDO.replace(/<emit>[\s\S]*?<\/emit>/, "");
    const r = parseNfeXml(semEmit);
    expect(r.ok).toBe(false);
  });
});

describe("normalizarNome", () => {
  it("remove acentos e normaliza espaços/caixa", () => {
    expect(normalizarNome("  Água  Mineral  500ML ")).toBe("agua mineral 500ml");
  });

  it("permite casamento por substring entre nome da nota e nome do estoque", () => {
    const doEstoque = normalizarNome("Arroz");
    const daNota = normalizarNome("ARROZ TIPO 1 5KG");
    expect(daNota.includes(doEstoque)).toBe(true);
  });
});
