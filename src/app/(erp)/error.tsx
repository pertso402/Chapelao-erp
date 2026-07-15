"use client";

export default function ErpError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div className="max-w-md">
        <p className="text-4xl">😕</p>
        <h1 className="mt-3 text-lg font-bold text-marino">Algo deu errado</h1>
        <p className="mt-1 text-sm text-muted">
          Tivemos um problema ao carregar esta tela. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-rojo px-4 py-2 font-semibold text-white transition hover:brightness-95"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
