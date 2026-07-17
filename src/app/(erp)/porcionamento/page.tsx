import Link from "next/link";
import { requirePermission, hasPermission, getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/PageHeader";
import { ItensDoDiaForm } from "@/components/porcionamento/ItensDoDiaForm";
import { listarCatalogoPorcionamento, getItensAtivosEfetivos } from "@/lib/porcionamento/queries";

export const dynamic = "force-dynamic";

export default async function PorcionamentoPage() {
  await requirePermission("porcionamento.operar");
  const [catalogo, efetivos, user] = await Promise.all([
    listarCatalogoPorcionamento(),
    getItensAtivosEfetivos(),
    getCurrentUser(),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Itens do dia"
          subtitle="Marque quais carnes e acompanhamentos estão no cardápio hoje. Isso filtra o que sai na comanda de montagem."
        />
        <div className="flex shrink-0 gap-2">
          <Link href="/porcionamento/comanda" className="rounded-lg bg-verde px-4 py-2 text-sm font-semibold text-white hover:brightness-95">🖨️ Imprimir comanda</Link>
          {user && hasPermission(user, "porcionamento.configurar") && (
            <Link href="/porcionamento/configurar" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-marino hover:bg-black/5">⚖️ Configurar porções</Link>
          )}
        </div>
      </div>

      <ItensDoDiaForm
        catalogo={catalogo}
        ativosIniciais={[...efetivos.ativos]}
        isFallback={efetivos.isFallback}
        dataFallback={efetivos.data}
      />
    </div>
  );
}
