import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listarComandasAbertas } from "@/lib/mesas/queries";
import { PageHeader } from "@/components/PageHeader";
import { AbrirMesaButton } from "@/components/mesas/AbrirMesaButton";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default async function MesasPage() {
  await requirePermission("pdv.use");
  const mesas = await listarComandasAbertas();

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Mesas" subtitle="Abra a mesa, lance os itens e feche depois no PDV pelo número da mesa." />
        <AbrirMesaButton />
      </div>

      {mesas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted">
          Nenhuma mesa aberta. Toque em “Abrir mesa”.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {mesas.map((m) => (
            <Link
              key={m.id}
              href={`/mesas/${m.id}`}
              className="rounded-2xl border border-border bg-card p-4 transition hover:border-azul"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-marino">Mesa {m.numero_mesa}</span>
                <span className="text-xs text-muted">{hora(m.aberta_em)}</span>
              </div>
              <div className="mt-2 text-xs text-muted">
                {m.itens.length} {m.itens.length === 1 ? "item" : "itens"}
              </div>
              <div className="mt-1 text-lg font-bold text-verde">{brl(m.total)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
