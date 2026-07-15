"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { receberRecebivel } from "@/lib/b2b/invoice-actions";

export function ReceberButton({ recebivelId }: { recebivelId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const r = await receberRecebivel(recebivelId);
          if (!r.ok) alert(r.erro);
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-lg bg-verde px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
    >
      {pending ? "Registrando…" : "Dar baixa (recebido)"}
    </button>
  );
}
