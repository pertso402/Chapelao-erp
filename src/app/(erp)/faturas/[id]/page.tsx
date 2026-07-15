import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getFatura, demonstrativo } from "@/lib/b2b/invoices";
import { getEmpresa } from "@/lib/b2b/queries";
import { ReceberButton } from "@/components/b2b/ReceberButton";

export const dynamic = "force-dynamic";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";

export default async function FaturaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("b2b.manage");
  const { id } = await params;
  const fatura = await getFatura(id);
  if (!fatura) notFound();

  const [empresa, demo] = await Promise.all([getEmpresa(fatura.company_id), demonstrativo(id)]);
  const periodo = new Date(fatura.periodo_inicio + "T12:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/empresas/${fatura.company_id}`} className="text-sm text-azul hover:underline">← Empresa</Link>
        <div className="mt-1 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-marino">Demonstrativo mensal</h1>
            <p className="text-sm capitalize text-muted">
              {empresa?.nome_fantasia || empresa?.razao_social} · {periodo}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${fatura.status === "paga" ? "bg-verde/15 text-verde" : "bg-amarillo text-marino"}`}>
            {fatura.status === "paga" ? "PAGA" : "FECHADA"}
          </span>
        </div>
      </div>

      {/* Totais */}
      <section className="grid grid-cols-3 gap-3">
        <Card label="Subtotal" valor={brl(Number(fatura.subtotal))} />
        <Card label="Desconto" valor={"− " + brl(Number(fatura.desconto))} />
        <Card label="Total da fatura" valor={brl(Number(fatura.total))} destaque />
      </section>

      {/* Conta a receber */}
      {demo.recebivel && (
        <section className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div>
            <div className="text-sm font-bold text-marino">Conta a receber</div>
            <div className="text-xs text-muted">
              {demo.recebivel.vencimento ? `Vencimento ${dia(demo.recebivel.vencimento)}` : "Sem vencimento"} ·{" "}
              {demo.recebivel.status === "pago" ? "recebido ✅" : "pendente"}
            </div>
          </div>
          {demo.recebivel.status !== "pago" && <ReceberButton recebivelId={demo.recebivel.id} />}
        </section>
      )}

      {/* Demonstrativo por funcionário */}
      <section className="space-y-4">
        {demo.porFuncionario.map((g) => (
          <div key={g.nome} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-marino">{g.nome}</h3>
              <span className="font-extrabold text-marino">{brl(g.total)}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-1">Data</th>
                  <th className="pb-1">Pedido</th>
                  <th className="pb-1">Itens</th>
                  <th className="pb-1 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {g.itens.map((it) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="py-1.5">{dia(it.data_pedido)}</td>
                    <td className="py-1.5">#{it.numero_pedido}</td>
                    <td className="py-1.5 text-muted">{it.descricao}</td>
                    <td className="py-1.5 text-right font-semibold text-marino">{brl(Number(it.valor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </div>
  );
}

function Card({ label, valor, destaque = false }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${destaque ? "border-verde bg-verde/5" : "border-border bg-card"}`}>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 font-extrabold ${destaque ? "text-verde" : "text-marino"}`}>{valor}</div>
    </div>
  );
}
