export function PageHeader({
  title,
  subtitle,
  demo = false,
}: {
  title: string;
  subtitle?: string;
  demo?: boolean;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-marino">{title}</h1>
        {demo && (
          <span className="rounded-full bg-amarillo px-2.5 py-1 text-xs font-bold text-marino">
            DADOS DE DEMONSTRAÇÃO
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}
