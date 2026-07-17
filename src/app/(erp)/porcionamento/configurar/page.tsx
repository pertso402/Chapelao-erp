import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/PageHeader";
import { ConfigGrid } from "@/components/porcionamento/ConfigGrid";
import { listarCatalogoPorcionamento, listarConfigPorcionamento, getLacunasConfiguracao } from "@/lib/porcionamento/queries";

export const dynamic = "force-dynamic";

export default async function ConfigurarPorcionamentoPage() {
  await requirePermission("porcionamento.configurar");
  const [catalogo, config, lacunas] = await Promise.all([
    listarCatalogoPorcionamento(),
    listarConfigPorcionamento(),
    getLacunasConfiguracao(),
  ]);

  return (
    <div>
      <Link href="/porcionamento" className="text-sm text-azul hover:underline">← Itens do dia</Link>
      <PageHeader
        title="Configurar porcionamento"
        subtitle="Quantas conchas/unidades de cada item vão em cada tamanho. Editável a qualquer momento, sem deploy."
      />
      <ConfigGrid catalogo={catalogo} configInicial={config} lacunas={lacunas} />
    </div>
  );
}
