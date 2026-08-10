"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { conciliarLinha, desconciliarLinha } from "@/lib/finance/conciliacao-actions";
import type { LinhaExtrato } from "@/lib/finance/conciliacao-queries";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");

export function LinhaExtratoRow({ linha }: { linha: LinhaExtrato }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [escolha, setEscolha] = useState(linha.sugestoes[0] ? `${linha.sugestoes[0].tipo}:${linha.sugestoes[0].id}` : "manual");

  function confirmar() {
    startTransition(async () => {
      if (escolha === "manual") {
        await conciliarLinha({ linhaId: linha.id, matchTipo: "manual", matchId: null });
      } else if (escolha) {
        const [tipo, id] = escolha.split(":");
        await conciliarLinha({ linhaId: linha.id, matchTipo: tipo as "payable" | "receivable", matchId: id });
      }
      router.refresh();
    });
  }

  function desfazer() {
    startTransition(async () => { await desconciliarLinha(linha.id); router.refresh(); });
  }

  const credito = linha.valor >= 0;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border py-2.5 text-sm last:border-0">
      <div className="min-w-[180px] flex-1">
        <div className="font-medium text-marino">{linha.descricao}</div>
        <div className="text-xs text-muted">{dia(linha.data)}</div>
      </div>
      <span className={`w-24 text-right font-bold ${credito ? "text-verde" : "text-rojo"}`}>
        {credito ? "+" : ""}{brl(linha.valor)}
      </span>

      {linha.conciliado ? (
        <div className="flex items-center gap-2">
          <span className="rounded bg-verde/15 px-2 py-1 text-xs font-bold text-verde">
            ✓ conciliada {linha.matchTipo === "manual" ? "(manual)" : linha.matchTipo === "payable" ? "— conta a pagar" : linha.matchTipo === "receivable" ? "— conta a receber" : ""}
          </span>
          <button onClick={desfazer} disabled={pending} className="text-xs text-muted hover:text-rojo hover:underline disabled:opacity-50">desfazer</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={escolha}
            onChange={(e) => setEscolha(e.target.value)}
            className="rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-azul"
          >
            <option value="manual">Marcar sem vínculo (manual)</option>
            {linha.sugestoes.map((s) => (
              <option key={`${s.tipo}:${s.id}`} value={`${s.tipo}:${s.id}`}>
                {s.tipo === "payable" ? "Pagar" : "Receber"}: {s.descricao} ({brl(s.valor)})
              </option>
            ))}
          </select>
          <button
            onClick={confirmar}
            disabled={pending}
            className="rounded-lg bg-verde px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {pending ? "…" : "Conciliar"}
          </button>
        </div>
      )}
    </div>
  );
}
