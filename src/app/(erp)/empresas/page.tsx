import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("b2b.manage");
  return (
    <ModulePlaceholder
      title="Empresas (B2B)"
      subtitle="Empresas, funcionários e regras comerciais."
      fase="Fase 4"
      demo={true}
    />
  );
}
