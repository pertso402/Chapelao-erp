import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { requirePermission } from "@/lib/auth/session";

export default async function Page() {
  await requirePermission("finance.view");
  return (
    <ModulePlaceholder
      title="Financeiro"
      subtitle="Contas a pagar/receber, caixa e DRE."
      fase="Fase 9"
      demo={true}
    />
  );
}
