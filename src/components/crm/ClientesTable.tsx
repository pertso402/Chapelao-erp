"use client";

import { useMemo, useState } from "react";
import type { ClienteLista } from "@/lib/crm/queries";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

const LABEL_SEGMENTO: Record<ClienteLista["segmento"], string> = {
  ativo: "Ativo", em_risco: "Em risco", inativo: "Inativo", sem_pedido: "Sem pedido", novo: "Novo",
};
const COR_SEGMENTO: Record<ClienteLista["segmento"], string> = {
  ativo: "bg-verde/15 text-verde", em_risco: "bg-amarillo/60 text-marino",
  inativo: "bg-rojo/15 text-rojo", sem_pedido: "bg-black/10 text-muted", novo: "bg-azul/15 text-azul",
};

export function ClientesTable({ clientes }: { clientes: ClienteLista[] }) {
  const [busca, setBusca] = useState("");
  const [segmento, setSegmento] = useState<string>("todos");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return clientes
      .filter((c) => (segmento === "todos" ? true : c.segmento === segmento))
      .filter((c) => !q || c.nome.toLowerCase().includes(q) || c.telefone.includes(q))
      .sort((a, b) => (b.ultimoPedido ?? "").localeCompare(a.ultimoPedido ?? ""));
  }, [clientes, busca, segmento]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone…"
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
        />
        <select value={segmento} onChange={(e) => setSegmento(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul">
          <option value="todos">Todos os segmentos</option>
          <option value="ativo">Ativos</option>
          <option value="em_risco">Em risco</option>
          <option value="inativo">Inativos</option>
          <option value="sem_pedido">Sem pedido</option>
        </select>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="text-left text-xs text-muted">
              <th className="pb-1">Nome</th>
              <th className="pb-1">Telefone</th>
              <th className="pb-1 text-right">Pedidos</th>
              <th className="pb-1 text-right">Total gasto</th>
              <th className="pb-1">Último pedido</th>
              <th className="pb-1">Segmento</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="py-1.5 font-medium text-marino">{c.nome}</td>
                <td className="py-1.5 text-muted">{c.telefone}</td>
                <td className="py-1.5 text-right text-marino">{c.pedidos}</td>
                <td className="py-1.5 text-right font-semibold text-marino">{brl(c.totalGasto)}</td>
                <td className="py-1.5 text-muted">{dt(c.ultimoPedido)}</td>
                <td className="py-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${COR_SEGMENTO[c.segmento]}`}>
                    {LABEL_SEGMENTO[c.segmento]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhum cliente encontrado.</p>}
      </div>
      <p className="mt-2 text-xs text-muted">{filtrados.length} de {clientes.length} clientes</p>
    </div>
  );
}
