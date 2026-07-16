import { requirePermission } from "@/lib/auth/session";
import { dreDoMes } from "@/lib/reporting/dre";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function RelatoriosPage() {
  await requirePermission("reports.view");
  const dre = await dreDoMes();

  return (
    <div>
      <PageHeader title="DRE gerencial" subtitle={`Demonstrativo de resultado por competência — ${dre.periodo}`} />

      {dre.naoClassificadas > 0 && (
        <p className="mb-4 rounded-lg bg-amarillo/20 px-3 py-2 text-sm text-marino">
          ⚠ {brl(dre.naoClassificadas)} em contas a pagar sem categoria — classifique no plano de contas para a DRE ficar completa.
        </p>
      )}

      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card">
        <div className="chap-stripe" />
        <table className="w-full text-sm">
          <tbody>
            <Linha label="Receita bruta" valor={dre.receitaBruta} />
            <Linha label="(−) Descontos" valor={-dre.descontos} sub />
            <Linha label="= Receita líquida" valor={dre.receitaLiquida} forte />
            <Linha label="(−) CMV (teórico)" valor={-dre.cmv} sub />
            <Linha label="= Margem bruta" valor={dre.margemBruta} forte extra={`${dre.margemBrutaPct.toFixed(1)}%`} corExtra="var(--chap-verde)" />

            <tr><td colSpan={2} className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-muted">Despesas operacionais</td></tr>
            {dre.despesas.length === 0 ? (
              <tr><td className="px-4 py-1.5 text-muted" colSpan={2}>Sem despesas classificadas no período.</td></tr>
            ) : (
              dre.despesas.map((d) => <Linha key={d.categoria} label={d.categoria} valor={-d.valor} sub />)
            )}
            <Linha label="(=) Total de despesas" valor={-dre.totalDespesas} />

            <tr className="border-t-2 border-marino">
              <td className="px-4 py-3 text-base font-extrabold text-marino">Resultado gerencial</td>
              <td className={`px-4 py-3 text-right text-base font-extrabold ${dre.resultado >= 0 ? "text-verde" : "text-rojo"}`}>
                {brl(dre.resultado)}
                <span className="ml-2 text-xs font-semibold text-muted">{dre.resultadoPct.toFixed(1)}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-muted">
        Receita e CMV vêm das vendas e fichas técnicas do mês; despesas vêm das contas a pagar classificadas pelo plano de contas.
      </p>
    </div>
  );
}

function Linha({ label, valor, sub = false, forte = false, extra, corExtra }: { label: string; valor: number; sub?: boolean; forte?: boolean; extra?: string; corExtra?: string }) {
  const brlS = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", signDisplay: valor < 0 ? "always" : "auto" });
  return (
    <tr className={forte ? "border-y border-border bg-black/[0.02]" : ""}>
      <td className={`px-4 py-1.5 ${sub ? "pl-8 text-muted" : "font-medium text-marino"} ${forte ? "font-bold text-marino" : ""}`}>{label}</td>
      <td className={`px-4 py-1.5 text-right ${valor < 0 ? "text-rojo" : "text-marino"} ${forte ? "font-extrabold" : ""}`}>
        {brlS}
        {extra && <span className="ml-2 text-xs font-semibold" style={{ color: corExtra }}>{extra}</span>}
      </td>
    </tr>
  );
}
