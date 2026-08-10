import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listarImportacoes, listarLinhasExtrato, resumoConciliacao } from "@/lib/finance/conciliacao-queries";
import { PageHeader } from "@/components/PageHeader";
import { ImportarExtratoButton } from "@/components/finance/ImportarExtratoButton";
import { LinhaExtratoRow } from "@/components/finance/LinhaExtratoRow";

export const dynamic = "force-dynamic";

export default async function ConciliacaoPage() {
  await requirePermission("finance.manage");
  const [importacoes, linhas, resumo] = await Promise.all([
    listarImportacoes(),
    listarLinhasExtrato(),
    resumoConciliacao(),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader
          title="Conciliação bancária"
          subtitle="Importe o extrato do banco (OFX ou CSV) e confira contra as contas a pagar/receber lançadas no sistema."
        />
        <Link href="/financeiro" className="mt-1 text-xs text-azul hover:underline">← voltar ao financeiro</Link>
      </div>

      <div className="mb-5 rounded-2xl border border-border bg-card p-4">
        <ImportarExtratoButton />
        <p className="mt-2 text-xs text-muted">
          Leitura do arquivo que você já exportou do internet banking — sem Open Finance, sem API de banco.
          Nada é lançado automaticamente: você confirma cada vínculo abaixo.
        </p>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="Linhas no extrato" valor={String(resumo.totalLinhas)} cor="var(--chap-marino)" />
        <Card label="Pendentes de conciliar" valor={String(resumo.pendentes)} cor="var(--chap-rojo)" />
        <Card label="Conciliadas" valor={String(resumo.conciliadas)} cor="var(--chap-verde)" />
      </section>

      {importacoes.length > 0 && (
        <div className="mb-5 rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 font-bold text-marino">Importações</h2>
          <div className="divide-y divide-border">
            {importacoes.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-marino">{i.nomeArquivo}</span>
                  <span className="ml-2 text-xs text-muted">({i.formato.toUpperCase()}, {i.totalLinhas} linhas)</span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(i.criadoEm).toLocaleDateString("pt-BR")}
                  {i.pendentes > 0 && <span className="ml-2 font-bold text-rojo">{i.pendentes} pendente(s)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-bold text-marino">Linhas do extrato</h2>
        {linhas.length === 0 ? (
          <p className="text-sm text-muted">
            {importacoes.length === 0 ? "Importe um extrato para começar." : "Tudo conciliado por aqui."}
          </p>
        ) : (
          <div>
            {linhas.map((l) => (
              <LinhaExtratoRow key={l.id} linha={l} />
            ))}
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
