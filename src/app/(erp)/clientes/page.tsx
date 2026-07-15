import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("customers.manage");
  return (
    <ModulePlaceholder
      title="Clientes"
      subtitle="Cadastro e histórico de clientes."
      fase="Fase 2"
      demo={false}
    />
  );
}
