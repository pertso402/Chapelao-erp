"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/BrandMark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErro("E-mail ou senha inválidos.");
        setCarregando(false);
        return;
      }
      // Navegação forçada (não router.push): garante que o servidor releia
      // os cookies recém-gravados sem depender de uma server action logo em
      // seguida ao login (fonte de uma falha intermitente). "/" já resolve
      // pro dashboard ou pra primeira rota permitida do papel do usuário.
      window.location.href = "/";
    } catch {
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="chap-stripe" />
        <div className="flex flex-col gap-6 p-8">
          <div className="flex justify-center">
            <BrandMark />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-marino">Acesso ao ERP</h1>
            <p className="mt-1 text-sm text-muted">Entre com suas credenciais</p>
          </div>

          <form onSubmit={entrar} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-marino">
              E-mail
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-azul"
                placeholder="voce@chapelao.com"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-marino">
              Senha
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-azul"
                placeholder="••••••••"
              />
            </label>

            {erro && (
              <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo" role="alert">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="rounded-lg bg-rojo px-4 py-2.5 font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
            >
              {carregando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
