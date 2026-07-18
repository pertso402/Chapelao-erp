"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  async function sair() {
    try {
      await createClient().auth.signOut();
    } catch {
      // Mesmo se a chamada de revogação falhar (rede instável), o storage
      // local já foi limpo pelo supabase-js — segue pro login de qualquer jeito.
    }
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={sair}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-marino transition hover:bg-black/5"
    >
      Sair
    </button>
  );
}
