"use client";

import { useEffect, useState } from "react";
import type { PedidoLista } from "@/lib/orders/queries";

const brl = (v: number | null) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const LABEL_CANAL: Record<string, string> = {
  whatsapp: "WhatsApp", telefone: "Telefone", balcao: "Balcão", ifood: "iFood",
};

export function PedidoPrintButton({ pedido }: { pedido: PedidoLista }) {
  const [imprimindo, setImprimindo] = useState(false);

  function imprimir() {
    setImprimindo(true);
  }

  useEffect(() => {
    if (!imprimindo) return;
    const t = setTimeout(() => window.print(), 100);
    return () => clearTimeout(t);
  }, [imprimindo]);

  useEffect(() => {
    function onAfterPrint() {
      setImprimindo(false);
    }
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  return (
    <>
      <button
        onClick={imprimir}
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-marino transition hover:bg-black/5"
      >
        🖨️ Imprimir
      </button>

      {imprimindo && (
        <div className="comanda-print hidden">
          <div style={{ textAlign: "center" }}>CHAPELÃO</div>
          <div style={{ textAlign: "center" }}>Pedido #{pedido.numero_pedido}</div>
          <div style={{ textAlign: "center" }}>
            {LABEL_CANAL[pedido.canal] ?? pedido.canal} ·{" "}
            {pedido.created_at
              ? new Date(pedido.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
              : ""}
          </div>
          <div>--------------------------------</div>
          <div>{pedido.cliente?.nome ?? "Cliente"}</div>
          {pedido.cliente?.telefone && <div>{pedido.cliente.telefone}</div>}
          {pedido.tipo_entrega === "delivery" && pedido.endereco_entrega && (
            <div>Entrega: {pedido.endereco_entrega}</div>
          )}
          <div>--------------------------------</div>
          {pedido.itens.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{i.quantidade}× {i.nome_produto}</span>
              <span>{brl(i.total)}</span>
            </div>
          ))}
          <div>--------------------------------</div>
          {pedido.subtotal != null && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span><span>{brl(pedido.subtotal)}</span>
            </div>
          )}
          {!!pedido.taxa_entrega && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Taxa de entrega</span><span>{brl(pedido.taxa_entrega)}</span>
            </div>
          )}
          {!!pedido.desconto && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Desconto</span><span>-{brl(pedido.desconto)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>TOTAL</span><span>{brl(pedido.total)}</span>
          </div>
          {pedido.forma_pagamento && <div>Pagamento: {pedido.forma_pagamento}</div>}
          {!!pedido.troco_para && <div>Troco para: {brl(pedido.troco_para)}</div>}
          {pedido.observacao && (
            <>
              <div>--------------------------------</div>
              <div>Obs: {pedido.observacao}</div>
            </>
          )}
        </div>
      )}
    </>
  );
}
