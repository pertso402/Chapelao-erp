"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  async function sair() {
    await createClient().auth.signOut();
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
