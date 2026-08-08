import { requirePermission } from "@/lib/auth/session";
import { listarClientesComMetricas, resumoClientes } from "@/lib/crm/queries";
import { PageHeader } from "@/components/PageHeader";
import { ClientesTable } from "@/components/crm/ClientesTable";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  await requirePermission("customers.manage");
  const [clientes, resumo] = await Promise.all([listarClientesComMetricas(), resumoClientes()]);

  return (
    <div>
      <PageHeader title="Clientes" subtitle="Cadastro e histórico — métricas calculadas a partir dos pedidos reais." />

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card label="Total" valor={String(resumo.total)} cor="var(--chap-marino)" />
        <Card label="Ativos" valor={String(resumo.ativos)} cor="var(--chap-verde)" />
        <Card label="Em risco" valor={String(resumo.emRisco)} cor="var(--chap-amarillo)" />
        <Card label="Inativos" valor={String(resumo.inativos)} cor="var(--chap-rojo)" />
        <Card label="Sem pedido" valor={String(resumo.semPedido)} cor="var(--chap-azul)" />
      </section>

      <ClientesTable clientes={clientes} />
    </div>
  );
}

function Card({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-extrabold" style={{ color: cor }}>{valor}</div>
    </div>
  );
}
