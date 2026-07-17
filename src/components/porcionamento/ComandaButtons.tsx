"use client";

import { useEffect, useState, useTransition } from "react";
import { imprimirComanda } from "@/lib/porcionamento/actions";
import type { Tamanho } from "@/lib/porcionamento/shared";

type Comanda = {
  tamanho: Tamanho;
  itens: { nome: string; quantidade: number; unidade: string }[];
  geradoEm: string;
};

const TAMANHOS: { v: Tamanho; label: string; cor: string }[] = [
  { v: "P", label: "Pequena", cor: "bg-azul" },
  { v: "M", label: "Média", cor: "bg-verde" },
  { v: "G", label: "Grande", cor: "bg-rojo" },
];

export function ComandaButtons() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [comanda, setComanda] = useState<Comanda | null>(null);

  function gerar(tamanho: Tamanho) {
    setErro(null);
    startTransition(async () => {
      const r = await imprimirComanda(tamanho);
      if (!r.ok) return setErro(r.erro);
      setComanda({ tamanho, itens: r.itens, geradoEm: r.geradoEm });
    });
  }

  useEffect(() => {
    if (!comanda) return;
    const t = setTimeout(() => window.print(), 150);
    return () => clearTimeout(t);
  }, [comanda]);

  useEffect(() => {
    function onAfterPrint() {
      setComanda(null);
    }
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  const TAMANHO_LABEL: Record<Tamanho, string> = { P: "PEQUENA", M: "MÉDIA", G: "GRANDE" };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:hidden">
        {TAMANHOS.map((t) => (
          <button
            key={t.v}
            onClick={() => gerar(t.v)}
            disabled={pending}
            className={`${t.cor} rounded-2xl py-14 text-3xl font-extrabold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {pending && <p className="mt-4 text-center text-sm text-muted print:hidden">Gerando comanda…</p>}
      {erro && <p className="mt-4 rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo print:hidden">{erro}</p>}
      {comanda && (
        <div className="mt-4 flex justify-center print:hidden">
          <button onClick={() => window.print()} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-marino hover:bg-black/5">
            🖨️ Imprimir novamente
          </button>
        </div>
      )}

      {comanda && (
        <div className="comanda-print hidden">
          <div style={{ textAlign: "center" }}>CHAPELÃO</div>
          <div style={{ textAlign: "center" }}>MARMITA {TAMANHO_LABEL[comanda.tamanho]}</div>
          <div style={{ textAlign: "center" }}>
            {new Date(comanda.geradoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </div>
          <div>--------------------------------</div>
          {comanda.itens.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{i.nome.toUpperCase()}</span>
              <span>{i.quantidade} {i.unidade}</span>
            </div>
          ))}
          <div>--------------------------------</div>
        </div>
      )}
    </div>
  );
}
