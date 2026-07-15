import { PageHeader } from "@/components/PageHeader";

export default function SemAcesso() {
  return (
    <div>
      <PageHeader title="Sem acesso" subtitle="Seu usuário ainda não tem módulos liberados." />
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
        Peça a um administrador para atribuir um papel ao seu usuário.
      </div>
    </div>
  );
}
