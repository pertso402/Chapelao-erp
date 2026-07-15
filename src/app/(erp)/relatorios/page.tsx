import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("reports.view");
  return (
    <ModulePlaceholder
      title="Relatórios"
      subtitle="Indicadores e relatórios gerenciais."
      fase="Fase 12"
      demo={true}
    />
  );
}
