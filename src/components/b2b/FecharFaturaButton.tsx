"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { fecharFaturaMes } from "@/lib/b2b/invoice-actions";

export function FecharFaturaButton({ companyId, elegiveis }: { companyId: string; elegiveis: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function fechar() {
    if (elegiveis === 0) return;
    if (!confirm(`Fechar a fatura do mês com ${elegiveis} pedido(s)? Eles não poderão mais ser alterados.`)) return;
    startTransition(async () => {
      const r = await fecharFaturaMes(companyId);
      if (!r.ok) {
        alert(r.erro);
        return;
      }
      router.push(`/faturas/${r.invoiceId}`);
    });
  }

  return (
    <button
      onClick={fechar}
      disabled={pending || elegiveis === 0}
      className="rounded-lg bg-verde px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
      title={elegiveis === 0 ? "Nenhum pedido a faturar neste mês" : ""}
    >
      {pending ? "Fechando…" : `Fechar fatura do mês (${elegiveis})`}
    </button>
  );
}
