"use client";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  async function sair() {
    try {
      await createClient().auth.signOut();
    } catch {
      // Mesmo se a chamada de revogação falhar (rede instável), segue pro
      // login de qualquer jeito.
    }
    // Navegação forçada (não router.push): garante uma recarga completa da
    // página, descartando qualquer estado/cliente Supabase em memória da
    // aba antiga. Sem isso, a mesma instância do cliente pode persistir
    // entre trocas de usuário na mesma aba e confundir o próximo login.
    window.location.href = "/login";
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
