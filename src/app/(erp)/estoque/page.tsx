import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listarEstoque, resumoEstoque } from "@/lib/inventory/queries";
import { PageHeader } from "@/components/PageHeader";
import { MovimentarButton } from "@/components/inventory/MovimentarButton";
import { NovoItemButton } from "@/components/inventory/NovoItemButton";

export const dynamic = "force-dynamic";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export default async function EstoquePage() {
  await requirePermission("inventory.manage");
  const supabase = await createClient();
  const [itens, resumo, { data: medidas }] = await Promise.all([
    listarEstoque(),
    resumoEstoque(),
    supabase.from("measurement_units").select("id, sigla").order("sigla"),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader title="Estoque" subtitle="Saldo por movimentos — todo saldo é reconstruível a partir de entradas, saídas e inventários." />
        <div className="flex gap-2">
          <Link href="/estoque/inventario" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-marino hover:bg-black/5">📋 Inventário</Link>
          <NovoItemButton medidas={medidas ?? []} />
        </div>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="Itens cadastrados" valor={String(resumo.itens)} cor="var(--chap-azul)" />
        <Card label="Abaixo do mínimo" valor={String(resumo.abaixoMinimo)} cor="var(--chap-rojo)" />
        <Card label="Valor em estoque" valor={brl(resumo.valorEstoque)} cor="var(--chap-verde)" />
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="p-3">Item</th>
              <th className="p-3 text-right">Saldo</th>
              <th className="p-3 text-right">Mínimo</th>
              <th className="p-3 text-right">Custo un.</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Link href={`/estoque/${i.id}`} className="font-medium text-marino hover:underline">{i.nome}</Link>
                  <span className="ml-2 text-xs text-muted">{i.categoria}</span>
                </td>
                <td className="p-3 text-right">
                  <span className={`font-bold ${i.abaixoMinimo ? "text-rojo" : "text-marino"}`}>{num(i.saldo)} {i.sigla}</span>
                  {i.abaixoMinimo && <span className="ml-1 text-xs font-bold text-rojo">⚠</span>}
                </td>
                <td className="p-3 text-right text-muted">{num(i.estoque_minimo)} {i.sigla}</td>
                <td className="p-3 text-right text-muted">{brl(i.custo_atual)}</td>
                <td className="p-3 text-right"><MovimentarButton itemId={i.id} nome={i.nome} sigla={i.sigla} /></td>
              </tr>
            ))}
          </tbody>
        </table>
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
