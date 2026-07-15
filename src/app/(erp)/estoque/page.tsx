import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("inventory.manage");
  return (
    <ModulePlaceholder
      title="Estoque"
      subtitle="Ingredientes, movimentos e inventário."
      fase="Fase 6"
      demo={true}
    />
  );
}
