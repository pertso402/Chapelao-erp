import { requirePermission } from "@/lib/auth/session";
import { listarCardapioComOpcoes } from "@/lib/catalog/queries";
import { PageHeader } from "@/components/PageHeader";
import { PdvForm } from "@/components/orders/PdvForm";

export const dynamic = "force-dynamic";

export default async function PdvPage() {
  await requirePermission("pdv.use");
  const produtos = await listarCardapioComOpcoes();

  return (
    <div>
      <PageHeader title="PDV / Balcão" subtitle="Monte o pedido em poucos cliques." />
      <PdvForm produtos={produtos} />
    </div>
  );
}
