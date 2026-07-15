import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("settings.manage");
  return (
    <ModulePlaceholder
      title="Configurações"
      subtitle="Usuários, catálogo e parâmetros do sistema."
      fase="Fase 13"
      demo={true}
    />
  );
}
