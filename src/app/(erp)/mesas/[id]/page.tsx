import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getComanda } from "@/lib/mesas/queries";
import { listarCardapioComOpcoes } from "@/lib/catalog/queries";
import { ComandaClient } from "@/components/mesas/ComandaClient";

export const dynamic = "force-dynamic";

export default async function ComandaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("pdv.use");
  const { id } = await params;
  const [comanda, produtos] = await Promise.all([getComanda(id), listarCardapioComOpcoes()]);
  if (!comanda) notFound();

  return (
    <div>
      <Link href="/mesas" className="text-sm text-azul hover:underline">← Mesas</Link>
      <div className="mt-2">
        <ComandaClient comanda={comanda} produtos={produtos} />
      </div>
    </div>
  );
}
