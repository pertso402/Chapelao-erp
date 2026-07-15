import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listarEstoque } from "@/lib/inventory/queries";
import { PageHeader } from "@/components/PageHeader";
import { InventarioForm } from "@/components/inventory/InventarioForm";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  await requirePermission("inventory.manage");
  const itens = await listarEstoque();

  return (
    <div>
      <Link href="/estoque" className="text-sm text-azul hover:underline">← Estoque</Link>
      <PageHeader
        title="Inventário (contagem física)"
        subtitle="Informe a quantidade contada. O sistema gera um ajuste pela diferença — o saldo passa a bater com a contagem."
      />
      <InventarioForm itens={itens.map((i) => ({ id: i.id, nome: i.nome, sigla: i.sigla, saldo: i.saldo }))} />
    </div>
  );
}
