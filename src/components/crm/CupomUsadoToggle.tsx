"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarCupomUsado } from "@/lib/crm/actions";

export function CupomUsadoToggle({ id, usado }: { id: string; usado: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => { await marcarCupomUsado(id, !usado); router.refresh(); })}
      disabled={pending}
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition disabled:opacity-50 ${usado ? "bg-black/10 text-muted" : "bg-verde/15 text-verde"}`}
    >
      {usado ? "usado" : "disponível"}
    </button>
  );
}
