"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { abrirMesa } from "@/lib/mesas/actions";

export function AbrirMesaButton() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [numero, setNumero] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function abrir() {
    setErro(null);
    startTransition(async () => {
      const r = await abrirMesa(Number(numero));
      if (!r.ok) return setErro(r.erro);
      setAberto(false);
      setNumero("");
      router.push(`/mesas/${r.id}`);
    });
  }

  return (
    <>
      <button onClick={() => setAberto(true)} className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">
        + Abrir mesa
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-3 p-5">
              <h2 className="font-extrabold text-marino">Abrir mesa</h2>
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && abrir()}
                placeholder="Nº da mesa"
                className="w-full rounded-lg border border-border px-3 py-3 text-center text-2xl font-bold outline-none focus:border-azul"
              />
              {erro && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
              <div className="flex gap-2">
                <button onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
                <button onClick={abrir} disabled={pending || !numero} className="flex-[2] rounded-lg bg-rojo py-2 text-sm font-bold text-white disabled:opacity-50">
                  {pending ? "Abrindo…" : "Abrir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
