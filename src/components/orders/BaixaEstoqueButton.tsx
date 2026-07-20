"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { baixarEstoquePedido } from "@/lib/inventory/baixa-venda";

export function BaixaEstoqueButton({ pedidoId, jaBaixado }: { pedidoId: string; jaBaixado: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (jaBaixado) {
    return <span className="text-xs font-semibold text-verde">✓ estoque baixado</span>;
  }

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const r = await baixarEstoquePedido(pedidoId);
          if (!r.ok) alert(r.erro);
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-lg border border-verde px-2.5 py-1 text-xs font-semibold text-verde transition hover:bg-verde/10 disabled:opacity-50"
      title="Deduz os ingredientes da ficha técnica de cada item do estoque"
    >
      {pending ? "…" : "📉 Baixar estoque"}
    </button>
  );
}
