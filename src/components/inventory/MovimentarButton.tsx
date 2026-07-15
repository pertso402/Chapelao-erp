"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarMovimento } from "@/lib/inventory/actions";

export function MovimentarButton({ itemId, nome, sigla }: { itemId: string; nome: string; sigla: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"entrada" | "saida" | "perda">("entrada");
  const [qtd, setQtd] = useState("");
  const [motivo, setMotivo] = useState("");

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await registrarMovimento({ item_id: itemId, tipo, quantidade: Number(qtd), motivo });
      if (!r.ok) return setErro(r.erro);
      setAberto(false);
      setQtd("");
      setMotivo("");
      router.refresh();
    });
  }

  const tipos = [
    { v: "entrada", label: "Entrada", cor: "bg-verde" },
    { v: "saida", label: "Saída", cor: "bg-marino" },
    { v: "perda", label: "Perda", cor: "bg-rojo" },
  ] as const;

  return (
    <>
      <button onClick={() => setAberto(true)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-marino hover:bg-black/5">
        Movimentar
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-3 p-5">
              <h2 className="font-extrabold text-marino">{nome}</h2>
              <div className="flex gap-2">
                {tipos.map((t) => (
                  <button key={t.v} onClick={() => setTipo(t.v)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition ${tipo === t.v ? t.cor + " text-white" : "border border-border text-marino"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <label className="block text-xs text-muted">Quantidade ({sigla})
                <input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} autoFocus
                  className="mt-0.5 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul" />
              </label>
              {tipo !== "entrada" && (
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Justificativa (obrigatória)"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul" />
              )}
              {tipo === "entrada" && (
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Observação (opcional)"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul" />
              )}
              {erro && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
              <div className="flex gap-2">
                <button onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
                <button onClick={salvar} disabled={pending} className="flex-[2] rounded-lg bg-rojo py-2 text-sm font-bold text-white disabled:opacity-50">
                  {pending ? "Salvando…" : "Registrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
