import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getFichaDoProduto } from "@/lib/recipes/queries";
import { listarEstoque } from "@/lib/inventory/queries";
import { PageHeader } from "@/components/PageHeader";
import { FichaEditor } from "@/components/recipes/FichaEditor";

export const dynamic = "force-dynamic";

export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("catalog.manage");
  const { id } = await params;
  const [ficha, estoque] = await Promise.all([getFichaDoProduto(id), listarEstoque()]);
  if (!ficha) notFound();

  const itensInventario = estoque.map((i) => ({ id: i.id, nome: i.nome, sigla: i.sigla, custo: i.custo_atual }));

  return (
    <div>
      <Link href="/cardapio" className="text-sm text-azul hover:underline">← Cardápio</Link>
      <PageHeader title={`Ficha técnica — ${ficha.produto.nome}`} subtitle="Ingredientes, custo teórico e margem. Simule alterações de preço." />
      <FichaEditor ficha={ficha} itensInventario={itensInventario} />
    </div>
  );
}
