import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listarRecebiveis, resumoReceber, listarPagaveis, resumoPagar, listarPlanoContas, listarCentrosCusto, agendaFinanceira } from "@/lib/finance/queries";
import { PageHeader } from "@/components/PageHeader";
import { ReceberButton } from "@/components/b2b/ReceberButton";
import { PagarButton } from "@/components/purchasing/PagarButton";
import { NovaDespesaButton } from "@/components/finance/NovaDespesaButton";

export const dynamic = "force-dynamic";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string | null) =>
  iso ? new Date(iso + "T12:00:00").toLocaleDateString("pt-BR") : "—";

export default async function FinanceiroPage() {
  await requirePermission("finance.view");
  const [recebiveis, resumo, pagaveis, resPagar, contas, centros, agenda] = await Promise.all([
    listarRecebiveis(), resumoReceber(), listarPagaveis(), resumoPagar(),
    listarPlanoContas(), listarCentrosCusto(), agendaFinanceira(),
  ]);
  const hoje = new Date().toISOString().slice(0, 10);
  const saldoProjetado = resumo.pendente - resPagar.pendente;

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader title="Financeiro" subtitle="Agenda, contas a receber (B2B) e contas a pagar." />
        <NovaDespesaButton contas={contas.map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo }))} centros={centros.map((c) => ({ id: c.id, nome: c.nome }))} />
      </div>

      {/* Agenda financeira */}
      <section className="mb-5 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-marino">Agenda financeira (pendentes)</h2>
          <span className="text-sm">Saldo projetado: <strong className={saldoProjetado >= 0 ? "text-verde" : "text-rojo"}>{brl(saldoProjetado)}</strong></span>
        </div>
        {agenda.length === 0 ? (
          <p className="text-sm text-muted">Nada pendente.</p>
        ) : (
          <div className="divide-y divide-border">
            {agenda.slice(0, 12).map((e, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${e.tipo === "receber" ? "bg-verde/15 text-verde" : "bg-rojo/10 text-rojo"}`}>
                    {e.tipo === "receber" ? "RECEBER" : "PAGAR"}
                  </span>
                  <span className="text-marino">{e.descricao}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{dia(e.vencimento)}</span>
                  <span className={`w-24 text-right font-bold ${e.tipo === "receber" ? "text-verde" : "text-rojo"}`}>
                    {e.tipo === "receber" ? "+" : "−"} {brl(e.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="A receber (pendente)" valor={brl(resumo.pendente)} cor="var(--chap-azul)" />
        <Card label="Vencido" valor={brl(resumo.vencido)} cor="var(--chap-rojo)" />
        <Card label="Recebido" valor={brl(resumo.recebido)} cor="var(--chap-verde)" />
      </section>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="A pagar (pendente)" valor={brl(resPagar.pendente)} cor="var(--chap-marino)" />
        <Card label="Vencido (a pagar)" valor={brl(resPagar.vencido)} cor="var(--chap-rojo)" />
        <Card label="Pago" valor={brl(resPagar.pago)} cor="var(--chap-verde)" />
      </section>

      <div className="mb-5 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-bold text-marino">Contas a pagar</h2>
        {pagaveis.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma conta a pagar. Registre uma compra para gerar.</p>
        ) : (
          <div className="divide-y divide-border">
            {pagaveis.map((p) => {
              const vencido = p.status === "pendente" && p.vencimento && p.vencimento < hoje;
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-marino">{p.descricao}</div>
                    <div className="text-xs text-muted">
                      Venc. {dia(p.vencimento)}
                      {vencido && <span className="ml-1 font-bold text-rojo">• vencido</span>}
                      {p.status === "pago" && <span className="ml-1 font-bold text-verde">• pago</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-marino">{brl(p.valor)}</span>
                    {p.status === "pendente" && <PagarButton payableId={p.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-bold text-marino">Contas a receber</h2>
        {recebiveis.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma conta a receber. Feche uma fatura B2B para gerar.</p>
        ) : (
          <div className="divide-y divide-border">
            {recebiveis.map((r) => {
              const vencido = r.status === "pendente" && r.vencimento && r.vencimento < hoje;
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-marino">{r.descricao}</div>
                    <div className="text-xs text-muted">
                      Venc. {dia(r.vencimento)}
                      {vencido && <span className="ml-1 font-bold text-rojo">• vencido</span>}
                      {r.status === "pago" && <span className="ml-1 font-bold text-verde">• recebido</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-marino">{brl(r.valor)}</span>
                    {r.status === "pendente" ? (
                      <ReceberButton recebivelId={r.id} />
                    ) : r.company_invoice_id ? (
                      <Link href={`/faturas/${r.company_invoice_id}`} className="text-xs text-azul hover:underline">
                        ver fatura
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-extrabold" style={{ color: cor }}>{valor}</div>
    </div>
  );
}
