"use client";

import type { PedidoLista } from "@/lib/orders/queries";

const brl = (v: number | null) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const LABEL_CANAL: Record<string, string> = {
  whatsapp: "WhatsApp", telefone: "Telefone", balcao: "Balcão", ifood: "iFood",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Monta o HTML da notinha (80mm) para impressão térmica.
function receiptHtml(p: PedidoLista): string {
  const linha = (a: string, b: string, bold = false) =>
    `<div style="display:flex;justify-content:space-between${bold ? ";font-weight:bold" : ""}"><span>${esc(a)}</span><span>${esc(b)}</span></div>`;
  const sep = `<div>--------------------------------</div>`;
  const data = p.created_at
    ? new Date(p.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

  let itens = "";
  for (const i of p.itens) {
    itens += linha(`${i.quantidade}x ${i.nome_produto}`, brl(i.total));
  }

  return `
    <div style="text-align:center;font-weight:bold;font-size:14px">RESTAURANTE CHAPELAO</div>
    <div style="text-align:center">2a Unidade</div>
    <div style="text-align:center">Pedido #${p.numero_pedido}</div>
    <div style="text-align:center">${esc(LABEL_CANAL[p.canal] ?? p.canal)} - ${esc(data)}</div>
    ${sep}
    <div>Cliente: ${esc(p.cliente?.nome ?? "Consumidor")}</div>
    ${p.cliente?.telefone ? `<div>Tel: ${esc(p.cliente.telefone)}</div>` : ""}
    ${p.tipo_entrega === "delivery" && p.endereco_entrega ? `<div>Entrega: ${esc(p.endereco_entrega)}</div>` : `<div>${p.tipo_entrega === "delivery" ? "Entrega" : "Retirada/Balcao"}</div>`}
    ${sep}
    ${itens}
    ${p.observacao ? `<div style="margin-top:2px">Obs: ${esc(p.observacao)}</div>` : ""}
    ${sep}
    ${p.subtotal != null ? linha("Subtotal", brl(p.subtotal)) : ""}
    ${p.taxa_entrega ? linha("Taxa entrega", brl(p.taxa_entrega)) : ""}
    ${p.desconto ? linha("Desconto", "-" + brl(p.desconto)) : ""}
    ${linha("TOTAL", brl(p.total), true)}
    ${p.forma_pagamento ? `<div>Pagamento: ${esc(p.forma_pagamento)}</div>` : ""}
    ${p.troco_para ? `<div>Troco para: ${brl(p.troco_para)}</div>` : ""}
    ${sep}
    <div style="text-align:center;margin-top:4px">Obrigado! 🎩</div>
  `;
}

export function PedidoPrintButton({ pedido }: { pedido: PedidoLista }) {
  function imprimir() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page { size: 80mm auto; margin: 0; }
      * { box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.35; width: 80mm; margin: 0; padding: 6px 8px; color: #000; }
    </style></head><body>${receiptHtml(pedido)}</body></html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    const win = iframe.contentWindow!;
    const finalizar = () => setTimeout(() => iframe.remove(), 500);
    win.onafterprint = finalizar;
    setTimeout(() => {
      win.focus();
      win.print();
      // fallback caso onafterprint não dispare
      setTimeout(finalizar, 3000);
    }, 250);
  }

  return (
    <button
      onClick={imprimir}
      className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-marino transition hover:bg-black/5"
    >
      🖨️ Imprimir
    </button>
  );
}
