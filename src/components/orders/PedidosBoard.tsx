"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PedidoLista } from "@/lib/orders/queries";
import {
  ABAS_STATUS,
  LABEL_STATUS,
  COR_STATUS,
  LABEL_CANAL,
  normalizarStatus,
  proximosStatus,
  type StatusCanonico,
} from "@/lib/orders/status";
import { mudarStatusPedido, cancelarPedido } from "@/lib/orders/actions";
import { PedidoPrintButton } from "@/components/orders/PedidoPrintButton";

const brl = (v: number | null) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const hora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

export function PedidosBoard({
  pedidos,
  podeGerenciar,
}: {
  pedidos: PedidoLista[];
  podeGerenciar: boolean;
}) {
  const router = useRouter();
  const [aba, setAba] = useState<StatusCanonico>("pendente");
  const [pending, startTransition] = useTransition();

  const porAba = useMemo(() => {
    const g: Record<StatusCanonico, PedidoLista[]> = {
      pendente: [], preparando: [], pronto: [], entregue: [], cancelado: [],
    };
    for (const p of pedidos) g[normalizarStatus(p.status)].push(p);
    return g;
  }, [pedidos]);

  const lista = porAba[aba];

  function acao(fn: () => Promise<{ ok: boolean; erro?: string }>) {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) alert(r.erro ?? "Não foi possível concluir a ação.");
      router.refresh();
    });
  }

  return (
    <div>
      {/* Abas */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ABAS_STATUS.map((s) => (
          <button
            key={s}
            onClick={() => setAba(s)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              aba === s ? "border-transparent text-white" : "border-border bg-card text-marino hover:bg-black/5"
            }`}
            style={aba === s ? { background: COR_STATUS[s] } : undefined}
          >
            {LABEL_STATUS[s]}
            <span
              className={`rounded-full px-1.5 text-xs ${aba === s ? "bg-white/25" : "bg-black/10"}`}
            >
              {porAba[s].length}
            </span>
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted">
          Nenhum pedido em “{LABEL_STATUS[aba]}”.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((p) => (
            <article key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-extrabold text-marino">#{p.numero_pedido}</span>
                  <span className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                    {LABEL_CANAL[p.canal] ?? p.canal}
                  </span>
                </div>
                <span className="text-xs text-muted">{hora(p.created_at)}</span>
              </div>

              <div className="mt-1 text-sm font-semibold text-marino">
                {p.cliente?.nome ?? "Cliente"}
              </div>
              {p.cliente?.telefone && (
                <div className="text-xs text-muted">{p.cliente.telefone}</div>
              )}

              <ul className="mt-2 flex-1 space-y-0.5 text-sm text-marino">
                {p.itens.map((i, idx) => (
                  <li key={idx}>
                    {i.quantidade}× {i.nome_produto}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                <span className="text-xs text-muted">
                  {p.tipo_entrega === "delivery" ? "🛵 Entrega" : "🏪 Retirada"}
                  {p.forma_pagamento ? ` · ${p.forma_pagamento}` : ""}
                </span>
                <span className="font-extrabold text-verde">{brl(p.total)}</span>
              </div>

              <div className="mt-2 flex justify-end print:hidden">
                <PedidoPrintButton pedido={p} />
              </div>

              {podeGerenciar && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {proximosStatus(p.status).map((acaoStatus) =>
                    acaoStatus.valor === "cancelado" ? (
                      <button
                        key={acaoStatus.valor}
                        disabled={pending}
                        onClick={() => {
                          const motivo = window.prompt("Motivo do cancelamento (obrigatório):");
                          if (motivo && motivo.trim()) acao(() => cancelarPedido(p.id, motivo.trim()));
                        }}
                        className="rounded-lg border border-rojo px-3 py-1.5 text-xs font-semibold text-rojo transition hover:bg-rojo/10 disabled:opacity-50"
                      >
                        {acaoStatus.label}
                      </button>
                    ) : (
                      <button
                        key={acaoStatus.valor}
                        disabled={pending}
                        onClick={() => acao(() => mudarStatusPedido(p.id, acaoStatus.valor))}
                        className="rounded-lg bg-marino px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                      >
                        {acaoStatus.label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
