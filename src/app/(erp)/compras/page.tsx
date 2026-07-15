import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("purchasing.manage");
  return (
    <ModulePlaceholder
      title="Compras"
      subtitle="Fornecedores, compras e recebimento."
      fase="Fase 8"
      demo={true}
    />
  );
}
