import { requirePermission } from "@/lib/auth/session";
import { listarProdutosDisponiveis, precoFinal } from "@/lib/catalog/queries";
import { PageHeader } from "@/components/PageHeader";
import { PdvForm } from "@/components/orders/PdvForm";

export const dynamic = "force-dynamic";

export default async function PdvPage() {
  await requirePermission("pdv.use");
  const produtos = await listarProdutosDisponiveis();
  const itens = produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    categoria: p.categoria,
    preco: precoFinal(p),
  }));

  return (
    <div>
      <PageHeader title="PDV / Balcão" subtitle="Monte o pedido em poucos cliques." />
      <PdvForm produtos={itens} />
    </div>
  );
}
