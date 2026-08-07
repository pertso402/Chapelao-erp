"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { vincularProdutosSemCusto } from "@/lib/recipes/actions";

export function VincularEstoqueButton({ pendentes }: { pendentes: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (pendentes === 0) return null;

  function vincular() {
    setMsg(null);
    startTransition(async () => {
      const r = await vincularProdutosSemCusto();
      if (!r.ok) { setMsg(r.erro); return; }
      setMsg(`${r.vinculados} produto(s) vinculado(s) ao estoque. Registre uma compra para definir o custo real de cada um.`);
      router.refresh();
    });
  }

  return (
    <div className="mb-4 rounded-2xl border border-amarillo bg-amarillo/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-marino">
          <strong>{pendentes} produto(s)</strong> ainda sem nenhum rastreamento de custo (nem ficha técnica, nem item de estoque).
        </p>
        <button
          onClick={vincular}
          disabled={pending}
          className="shrink-0 rounded-lg bg-marino px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Vinculando…" : "🔗 Vincular todos ao estoque"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-marino">{msg}</p>}
    </div>
  );
}
