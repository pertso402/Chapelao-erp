import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listarRecebiveis, resumoReceber } from "@/lib/finance/queries";
import { PageHeader } from "@/components/PageHeader";
import { ReceberButton } from "@/components/b2b/ReceberButton";

export const dynamic = "force-dynamic";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string | null) =>
  iso ? new Date(iso + "T12:00:00").toLocaleDateString("pt-BR") : "—";

export default async function FinanceiroPage() {
  await requirePermission("finance.view");
  const [recebiveis, resumo] = await Promise.all([listarRecebiveis(), resumoReceber()]);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="Contas a receber do faturamento corporativo B2B." />

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="A receber (pendente)" valor={brl(resumo.pendente)} cor="var(--chap-azul)" />
        <Card label="Vencido" valor={brl(resumo.vencido)} cor="var(--chap-rojo)" />
        <Card label="Recebido" valor={brl(resumo.recebido)} cor="var(--chap-verde)" />
      </section>

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
