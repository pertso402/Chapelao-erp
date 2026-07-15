import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("kitchen.view");
  return (
    <ModulePlaceholder
      title="Cozinha"
      subtitle="Painel de despacho e acompanhamento."
      fase="Fase 2"
      demo={false}
    />
  );
}
