import { requirePermission } from "@/lib/auth/session";
import { listarPedidos } from "@/lib/orders/queries";
import { PageHeader } from "@/components/PageHeader";
import { PedidosBoard } from "@/components/orders/PedidosBoard";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const user = await requirePermission("orders.view");
  const pedidos = await listarPedidos();
  const podeGerenciar = user.permissions.includes("orders.manage");

  return (
    <div>
      <PageHeader
        title="Pedidos"
        subtitle="Todos os canais no mesmo ciclo: WhatsApp, telefone e balcão."
      />
      <PedidosBoard pedidos={pedidos} podeGerenciar={podeGerenciar} />
    </div>
  );
}
