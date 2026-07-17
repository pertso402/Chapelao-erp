import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/PageHeader";
import { ComandaButtons } from "@/components/porcionamento/ComandaButtons";

export const dynamic = "force-dynamic";

export default async function ComandaPage() {
  await requirePermission("porcionamento.operar");

  return (
    <div>
      <div className="print:hidden">
        <Link href="/porcionamento" className="text-sm text-azul hover:underline">← Itens do dia</Link>
        <PageHeader
          title="Comanda de montagem"
          subtitle="Escolha o tamanho da marmita. A comanda sai na impressora com os itens ativos hoje."
        />
      </div>
      <ComandaButtons />
    </div>
  );
}
