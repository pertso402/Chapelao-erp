import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("catalog.manage");
  return (
    <ModulePlaceholder
      title="Cardápio"
      subtitle="Marmitas, tamanhos, opções e adicionais configuráveis."
      fase="Fase 3"
      demo={true}
    />
  );
}
