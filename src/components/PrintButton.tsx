"use client";

export function PrintButton({ label = "🖨️ Imprimir" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-lg border border-border px-4 py-2 text-sm font-semibold text-marino transition hover:bg-black/5"
    >
      {label}
    </button>
  );
}
