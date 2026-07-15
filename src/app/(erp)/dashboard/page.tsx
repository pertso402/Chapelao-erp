import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/PageHeader";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({
  label,
  value,
  accent,
  demo = false,
}: {
  label: string;
  value: string;
  accent: string;
  demo?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        {demo && (
          <span className="rounded bg-amarillo px-1.5 py-0.5 text-[10px] font-bold text-marino">
            DEMO
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-extrabold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  await requirePermission("dashboard.view");
  const supabase = await createClient();

  // Números reais dos pedidos já existentes no banco (agente/painel).
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("total, status");

  const totalPedidos = pedidos?.length ?? 0;
  const faturamento = (pedidos ?? []).reduce((s, p) => s + Number(p.total ?? 0), 0);
  const ticket = totalPedidos ? faturamento / totalPedidos : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da 2ª unidade — dados reais onde disponíveis; indicadores gerenciais marcados como demonstração até as fases correspondentes."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pedidos (total)" value={String(totalPedidos)} accent="var(--chap-azul)" />
        <StatCard label="Faturamento" value={brl(faturamento)} accent="var(--chap-verde)" />
        <StatCard label="Ticket médio" value={brl(ticket)} accent="var(--chap-marino)" />
        <StatCard label="CMV teórico" value="—" accent="var(--chap-rojo)" demo />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Margem bruta" value="—" accent="var(--chap-verde)" demo />
        <StatCard label="Despesas do mês" value="—" accent="var(--chap-rojo)" demo />
        <StatCard label="Contas vencidas" value="—" accent="var(--chap-rojo)" demo />
        <StatCard label="Consumo B2B" value="—" accent="var(--chap-azul)" demo />
      </section>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold text-marino">Fase 1 concluída ✅</h2>
        <p className="mt-1 text-sm text-muted">
          Fundação do ERP no ar: autenticação, perfis e permissões, e as abas visíveis conforme o
          papel do usuário. Os cartões marcados como <strong>DEMO</strong> serão preenchidos com
          dados reais nas fases de estoque, financeiro e DRE.
        </p>
      </div>
    </div>
  );
}
