import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getItemComHistorico } from "@/lib/inventory/queries";
import { MovimentarButton } from "@/components/inventory/MovimentarButton";

export const dynamic = "force-dynamic";

const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3, signDisplay: "exceptZero" });
const numAbs = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const dt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const LABEL: Record<string, string> = { entrada: "Entrada", saida: "Saída", perda: "Perda", ajuste: "Ajuste", inventario: "Inventário" };

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("inventory.manage");
  const { id } = await params;
  const data = await getItemComHistorico(id);
  if (!data) notFound();
  const { item, movimentos } = data;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/estoque" className="text-sm text-azul hover:underline">← Estoque</Link>
        <div className="mt-1 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-marino">{item.nome}</h1>
            <p className="text-sm text-muted">
              Saldo atual: <strong className={item.saldo < item.estoque_minimo ? "text-rojo" : "text-marino"}>{numAbs(item.saldo)} {item.sigla}</strong>
              {" · "}mínimo {numAbs(item.estoque_minimo)} {item.sigla}
            </p>
          </div>
          <MovimentarButton itemId={item.id} nome={item.nome} sigla={item.sigla} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-bold text-marino">Movimentos (o saldo é a soma desta coluna)</h2>
        {movimentos.length === 0 ? (
          <p className="text-sm text-muted">Sem movimentos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-1">Data</th>
                <th className="pb-1">Tipo</th>
                <th className="pb-1">Motivo</th>
                <th className="pb-1 text-right">Qtd</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="py-1.5 text-muted">{dt(m.created_at)}</td>
                  <td className="py-1.5">{LABEL[m.tipo] ?? m.tipo}</td>
                  <td className="py-1.5 text-muted">{m.motivo ?? "—"}</td>
                  <td className={`py-1.5 text-right font-semibold ${m.quantidade < 0 ? "text-rojo" : "text-verde"}`}>
                    {num(m.quantidade)} {item.sigla}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
