"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { pagarPayable } from "@/lib/purchasing/actions";

export function PagarButton({ payableId }: { payableId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => { await pagarPayable(payableId); router.refresh(); })}
      disabled={pending}
      className="rounded-lg bg-marino px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
    >
      {pending ? "…" : "Pagar"}
    </button>
  );
}
