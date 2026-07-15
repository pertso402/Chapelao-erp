import { PageHeader } from "@/components/PageHeader";

// Casca de módulo ainda não implementado. Usado nas telas da demonstração.
export function ModulePlaceholder({
  title,
  subtitle,
  fase,
  demo = false,
}: {
  title: string;
  subtitle?: string;
  fase: string;
  demo?: boolean;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} demo={demo} />
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-4xl">🚧</p>
        <p className="mt-3 font-semibold text-marino">Módulo em construção</p>
        <p className="mt-1 text-sm text-muted">
          Será entregue na <strong>{fase}</strong> do roadmap.
        </p>
      </div>
    </div>
  );
}
