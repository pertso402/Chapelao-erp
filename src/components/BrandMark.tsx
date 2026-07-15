export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-full bg-amarillo text-lg shadow-sm"
      >
        🎩
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-rojo">
            Restaurante
          </span>
          <span className="block text-lg font-extrabold text-rojo">Chapelão</span>
        </span>
      )}
    </div>
  );
}
