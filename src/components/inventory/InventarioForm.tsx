"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajustarInventario } from "@/lib/inventory/actions";

type Item = { id: string; nome: string; sigla: string; saldo: number };

export function InventarioForm({ itens }: { itens: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [contagem, setContagem] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  function aplicar() {
    const alteracoes = itens.filter((i) => contagem[i.id] !== undefined && contagem[i.id] !== "");
    if (alteracoes.length === 0) {
      setMsg("Informe ao menos uma contagem.");
      return;
    }
    setMsg(null);
    startTransition(async () => {
      let ajustados = 0;
      for (const i of alteracoes) {
        const r = await ajustarInventario({ item_id: i.id, qtd_contada: Number(contagem[i.id]), saldo_sistema: i.saldo });
        if (r.ok && r.ajustado) ajustados++;
      }
      setContagem({});
      setMsg(`Inventário aplicado. ${ajustados} item(ns) ajustado(s).`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="pb-2">Item</th>
            <th className="pb-2 text-right">Sistema</th>
            <th className="pb-2 text-right">Contado</th>
            <th className="pb-2 text-right">Diferença</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => {
            const val = contagem[i.id];
            const diff = val !== undefined && val !== "" ? Number(val) - i.saldo : null;
            return (
              <tr key={i.id} className="border-t border-border">
                <td className="py-2 font-medium text-marino">{i.nome}</td>
                <td className="py-2 text-right text-muted">{i.saldo.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} {i.sigla}</td>
                <td className="py-2 text-right">
                  <input type="number" value={val ?? ""} onChange={(e) => setContagem((c) => ({ ...c, [i.id]: e.target.value }))}
                    placeholder="—" className="w-24 rounded-lg border border-border px-2 py-1 text-right outline-none focus:border-azul" />
                </td>
                <td className={`py-2 text-right font-semibold ${diff === null ? "text-muted" : diff === 0 ? "text-muted" : diff < 0 ? "text-rojo" : "text-verde"}`}>
                  {diff === null ? "—" : diff.toLocaleString("pt-BR", { maximumFractionDigits: 3, signDisplay: "exceptZero" })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {msg && <p className="mt-3 rounded-lg bg-amarillo/20 px-3 py-2 text-sm text-marino">{msg}</p>}

      <button onClick={aplicar} disabled={pending} className="mt-4 rounded-lg bg-rojo px-5 py-2.5 font-bold text-white transition hover:brightness-95 disabled:opacity-50">
        {pending ? "Aplicando…" : "Aplicar contagem"}
      </button>
    </div>
  );
}
