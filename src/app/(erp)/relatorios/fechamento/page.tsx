import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { gerarFechamentoMensal } from "@/lib/reporting/fechamento";
import { PageHeader } from "@/components/PageHeader";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtBr = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
const fmtDt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

function mesAtual() {
  const a = new Date();
  const ini = new Date(a.getFullYear(), a.getMonth(), 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { de: iso(ini), ate: iso(a) };
}

export default async function FechamentoMensalPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  await requirePermission("finance.view");
  const sp = await searchParams;
  const def = mesAtual();
  const de = sp.de ?? def.de;
  const ate = sp.ate ?? def.ate;

  const f = await gerarFechamentoMensal(de, ate);
  const inputCls = "rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  return (
    <div>
      <Link href="/relatorios" className="no-print text-sm text-azul hover:underline">← Relatórios</Link>
      <PageHeader title="Fechamento mensal para o contador" subtitle="Gerado sob demanda — puxe quando quiser fechar o mês. Nada aqui é enviado automaticamente." />

      <form method="GET" className="no-print mb-5 flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-3">
        <label className="text-xs text-muted">De
          <input type="date" name="de" defaultValue={de} className={inputCls + " mt-0.5 block"} />
        </label>
        <label className="text-xs text-muted">Até
          <input type="date" name="ate" defaultValue={ate} className={inputCls + " mt-0.5 block"} />
        </label>
        <button type="submit" className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white">Gerar</button>
        <div className="ml-auto"><PrintButton label="🖨️ Imprimir / salvar PDF" /></div>
      </form>

      <div className="print-area space-y-5 rounded-2xl border border-border bg-card p-5">
        <div className="border-b border-border pb-3">
          <div className="text-lg font-extrabold text-rojo">🎩 Restaurante Chapelão — 2ª Unidade</div>
          <div className="text-xs text-muted">Fechamento do período {fmtBr(de)} a {fmtBr(ate)} · gerado em {new Date().toLocaleString("pt-BR")}</div>
        </div>

        {/* Vendas */}
        <section>
          <h2 className="mb-2 text-base font-bold text-marino">1. Vendas</h2>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Card label="Pedidos" valor={String(f.vendas.totalPedidos)} />
            <Card label="Receita bruta" valor={brl(f.vendas.receitaBruta)} />
            <Card label="Descontos" valor={"− " + brl(f.vendas.descontos)} />
            <Card label="Receita líquida" valor={brl(f.vendas.receitaLiquida)} destaque />
          </div>
          {f.vendas.cancelamentos > 0 && (
            <p className="mt-2 text-xs text-muted">{f.vendas.cancelamentos} pedido(s) cancelado(s) no período (não incluídos acima).</p>
          )}
          <table className="mt-3 w-full max-w-sm text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="pb-1">Forma de pagamento</th><th className="pb-1 text-right">Total</th></tr></thead>
            <tbody>
              {f.vendas.porPagamento.map((p) => (
                <tr key={p.forma} className="border-t border-border">
                  <td className="py-1 text-marino">{p.forma}</td>
                  <td className="py-1 text-right font-semibold text-marino">{brl(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Compras */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-marino">2. Compras / entradas de nota</h2>
            <span className="font-bold text-marino">{brl(f.totalCompras)}</span>
          </div>
          {f.compras.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma compra no período.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-left text-xs text-muted"><th className="pb-1">Data</th><th className="pb-1">Fornecedor</th><th className="pb-1 text-right">Valor</th><th className="pb-1">Anexo</th></tr></thead>
              <tbody>
                {f.compras.map((c, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1 text-muted">{fmtDt(c.dataCompra)}</td>
                    <td className="py-1 text-marino">{c.fornecedor}</td>
                    <td className="py-1 text-right font-semibold text-marino">{brl(c.total)}</td>
                    <td className="py-1">
                      {c.anexoUrl ? (
                        <a href={c.anexoUrl} target="_blank" rel="noopener noreferrer" className="no-print text-xs text-azul hover:underline">📎 {c.anexoNome}</a>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Financeiro */}
        <section>
          <h2 className="mb-2 text-base font-bold text-marino">3. Movimentações financeiras (baixas no período)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm font-semibold text-marino">
                <span>Contas pagas</span><span>{brl(f.totalPago)}</span>
              </div>
              {f.contasPagas.length === 0 ? <p className="text-xs text-muted">Nenhuma.</p> : (
                <ul className="space-y-0.5 text-sm">
                  {f.contasPagas.map((c, i) => (
                    <li key={i} className="flex justify-between"><span className="text-muted">{c.descricao} ({fmtDt(c.pagoEm)})</span><span className="text-marino">{brl(c.valor)}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm font-semibold text-marino">
                <span>Contas recebidas</span><span>{brl(f.totalRecebido)}</span>
              </div>
              {f.contasRecebidas.length === 0 ? <p className="text-xs text-muted">Nenhuma.</p> : (
                <ul className="space-y-0.5 text-sm">
                  {f.contasRecebidas.map((c, i) => (
                    <li key={i} className="flex justify-between"><span className="text-muted">{c.descricao} ({fmtDt(c.pagoEm)})</span><span className="text-marino">{brl(c.valor)}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ label, valor, destaque = false }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${destaque ? "border-verde bg-verde/5" : "border-border"}`}>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-0.5 font-extrabold ${destaque ? "text-verde" : "text-marino"}`}>{valor}</div>
    </div>
  );
}
