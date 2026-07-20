import { requirePermission } from "@/lib/auth/session";
import { dreDoMes } from "@/lib/reporting/dre";
import { gerarRelatorio, TIPOS_RELATORIO } from "@/lib/reporting/reports";
import { PageHeader } from "@/components/PageHeader";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtBr = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");

function mesAtual() {
  const a = new Date();
  const ini = new Date(a.getFullYear(), a.getMonth(), 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { de: iso(ini), ate: iso(a) };
}

const OPCOES = [...TIPOS_RELATORIO, { valor: "dre", label: "DRE gerencial" }];

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<{ tipo?: string; de?: string; ate?: string }> }) {
  await requirePermission("reports.view");
  const sp = await searchParams;
  const def = mesAtual();
  const tipo = sp.tipo ?? "vendas_dia";
  const de = sp.de ?? def.de;
  const ate = sp.ate ?? def.ate;

  const inputCls = "rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Escolha o relatório e o período, depois imprima." />

      {/* Filtros (não imprime) */}
      <form method="GET" className="no-print mb-5 flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-3">
        <label className="text-xs text-muted">Relatório
          <select name="tipo" defaultValue={tipo} className={inputCls + " mt-0.5 block w-56"}>
            {OPCOES.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted">De
          <input type="date" name="de" defaultValue={de} className={inputCls + " mt-0.5 block"} />
        </label>
        <label className="text-xs text-muted">Até
          <input type="date" name="ate" defaultValue={ate} className={inputCls + " mt-0.5 block"} />
        </label>
        <button type="submit" className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white">Gerar</button>
        <div className="ml-auto"><PrintButton /></div>
      </form>

      {/* Área imprimível */}
      <div className="print-area rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 border-b border-border pb-3">
          <div className="text-lg font-extrabold text-rojo">🎩 Restaurante Chapelão — 2ª Unidade</div>
          <div className="text-xs text-muted">Período: {fmtBr(de)} a {fmtBr(ate)} · gerado em {new Date().toLocaleString("pt-BR")}</div>
        </div>

        {tipo === "dre" ? (
          <DreView de={de} ate={ate} />
        ) : (
          <TabelaRelatorio tipo={tipo} de={de} ate={ate} />
        )}
      </div>
    </div>
  );
}

async function TabelaRelatorio({ tipo, de, ate }: { tipo: string; de: string; ate: string }) {
  const rel = await gerarRelatorio(tipo, de, ate);
  return (
    <div>
      <h2 className="mb-3 text-base font-bold text-marino">{rel.titulo}</h2>
      {rel.linhas.length === 0 ? (
        <p className="text-sm text-muted">Sem dados no período.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              {rel.colunas.map((c) => <th key={c.key} className={`pb-1 ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rel.linhas.map((l, i) => (
              <tr key={i} className="border-b border-border/60">
                {rel.colunas.map((c) => <td key={c.key} className={`py-1.5 ${c.align === "right" ? "text-right" : ""} text-marino`}>{l[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
          {rel.totais && (
            <tfoot>
              <tr className="border-t-2 border-marino font-bold text-marino">
                {rel.colunas.map((c) => <td key={c.key} className={`pt-2 ${c.align === "right" ? "text-right" : ""}`}>{rel.totais![c.key]}</td>)}
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  );
}

async function DreView({ de, ate }: { de: string; ate: string }) {
  const ini = new Date(de + "T00:00:00");
  const fimExcl = new Date(new Date(ate + "T00:00:00").getTime() + 864e5);
  const dre = await dreDoMes(ini, fimExcl);
  const linha = (label: string, valor: number, opts: { forte?: boolean; sub?: boolean } = {}) => (
    <tr className={opts.forte ? "border-y border-border bg-black/[0.02] font-bold" : ""}>
      <td className={`py-1.5 ${opts.sub ? "pl-6 text-muted" : "text-marino"}`}>{label}</td>
      <td className={`py-1.5 text-right ${valor < 0 ? "text-rojo" : "text-marino"}`}>{valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", signDisplay: valor < 0 ? "always" : "auto" })}</td>
    </tr>
  );
  return (
    <div>
      <h2 className="mb-3 text-base font-bold text-marino">DRE gerencial</h2>
      <table className="w-full max-w-xl text-sm">
        <tbody>
          {linha("Receita bruta", dre.receitaBruta)}
          {linha("(−) Descontos", -dre.descontos, { sub: true })}
          {linha("= Receita líquida", dre.receitaLiquida, { forte: true })}
          {linha("(−) CMV (teórico)", -dre.cmv, { sub: true })}
          {linha("= Margem bruta", dre.margemBruta, { forte: true })}
          {dre.despesas.map((d) => linha(d.categoria, -d.valor, { sub: true }))}
          {linha("(=) Total de despesas", -dre.totalDespesas)}
          <tr className="border-t-2 border-marino text-base font-extrabold">
            <td className="py-2 text-marino">Resultado gerencial</td>
            <td className={`py-2 text-right ${dre.resultado >= 0 ? "text-verde" : "text-rojo"}`}>{brl(dre.resultado)} <span className="text-xs text-muted">{dre.resultadoPct.toFixed(1)}%</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
