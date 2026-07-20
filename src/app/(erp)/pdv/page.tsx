import { requirePermission } from "@/lib/auth/session";
import { listarCardapioComOpcoes } from "@/lib/catalog/queries";
import { listarEmpresasParaPdv } from "@/lib/b2b/queries";
import { PageHeader } from "@/components/PageHeader";
import { PdvForm } from "@/components/orders/PdvForm";

export const dynamic = "force-dynamic";

export default async function PdvPage({ searchParams }: { searchParams: Promise<{ mesa?: string }> }) {
  await requirePermission("pdv.use");
  const [{ mesa }, produtos, empresas] = await Promise.all([
    searchParams,
    listarCardapioComOpcoes(),
    listarEmpresasParaPdv(),
  ]);

  return (
    <div>
      <PageHeader title="PDV / Balcão" subtitle="Monte o pedido, ou informe o nº da mesa para fechar a comanda." />
      <PdvForm produtos={produtos} empresas={empresas} mesaInicial={mesa} />
    </div>
  );
}
