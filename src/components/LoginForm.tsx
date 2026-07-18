"use client";

import { useState } from "react";
import { entrarComNomeSenha } from "@/app/(auth)/login/actions";

export function LoginForm({ colaboradores }: { colaboradores: string[] }) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function selecionar(nome: string) {
    setSelecionado(nome);
    setSenha("");
    setErro(null);
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!selecionado) return;
    setErro(null);
    setCarregando(true);
    try {
      const r = await entrarComNomeSenha(selecionado, senha);
      if (!r.ok) {
        setErro(r.erro);
        setCarregando(false);
        return;
      }
      // Navegação forçada: recarrega do zero, sem depender de estado do
      // cliente Supabase em memória na aba.
      window.location.href = "/";
    } catch {
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
      setCarregando(false);
    }
  }

  if (!selecionado) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-center text-sm text-muted">Quem é você?</p>
        <div className="grid grid-cols-2 gap-2">
          {colaboradores.map((nome) => (
            <button
              key={nome}
              onClick={() => selecionar(nome)}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-marino transition hover:border-azul hover:bg-azul/5"
            >
              {nome}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={entrar} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setSelecionado(null)}
        className="self-start text-xs font-semibold text-azul hover:underline"
      >
        ← Trocar
      </button>
      <p className="text-center text-lg font-extrabold text-marino">{selecionado}</p>
      <label className="flex flex-col gap-1 text-sm font-medium text-marino">
        Senha
        <input
          type="password"
          required
          autoFocus
          inputMode="numeric"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-azul"
          placeholder="••••"
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
  );
}
