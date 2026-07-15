"use client";

import { useState } from "react";
import type { ProdutoComOpcoes } from "@/lib/catalog/queries";
import type { LinhaCarrinho } from "@/components/orders/PdvForm";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function MontagemModal({
  produto,
  onConfirmar,
  onCancelar,
}: {
  produto: ProdutoComOpcoes;
  onConfirmar: (linha: LinhaCarrinho) => void;
  onCancelar: () => void;
}) {
  // seleção: grupo → set de option ids
  const [sel, setSel] = useState<Record<string, Set<string>>>({});

  function toggle(groupId: string, optId: string, max: number | null) {
    setSel((s) => {
      const atual = new Set(s[groupId] ?? []);
      if (atual.has(optId)) {
        atual.delete(optId);
      } else {
        if (max === 1) atual.clear(); // rádio
        if (max !== null && atual.size >= max) return s; // atingiu o máximo
        atual.add(optId);
      }
      return { ...s, [groupId]: atual };
    });
  }

  // valida min/max de cada grupo
  const pendencias = produto.grupos.filter((g) => {
    const n = sel[g.id]?.size ?? 0;
    return n < g.min_escolhas;
  });
  const valido = pendencias.length === 0;

  // preço = base + adicionais
  const opcoesEscolhidas = produto.grupos.flatMap((g) =>
    [...(sel[g.id] ?? [])].map((optId) => {
      const o = g.opcoes.find((x) => x.id === optId)!;
      return { option_id: o.id, nome: o.nome, preco: o.preco_adicional };
    }),
  );
  const precoUnit = produto.preco + opcoesEscolhidas.reduce((s, o) => s + o.preco, 0);

  // composição legível: "Bife · Arroz, Feijão · +Ovo (+R$3,00)"
  const composicao = produto.grupos
    .map((g) => {
      const nomes = [...(sel[g.id] ?? [])].map((id) => g.opcoes.find((o) => o.id === id)!.nome);
      return nomes.length ? nomes.join(", ") : null;
    })
    .filter(Boolean)
    .join(" · ");

  function confirmar() {
    onConfirmar({
      key: crypto.randomUUID(),
      produto_id: produto.id,
      nome: produto.nome,
      preco_unitario: precoUnit,
      quantidade: 1,
      opcoes: opcoesEscolhidas,
      composicao: composicao || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancelar}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="chap-stripe" />
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-extrabold text-marino">{produto.nome}</h2>
          <span className="font-bold text-verde">{brl(precoUnit)}</span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {produto.grupos.map((g) => {
            const n = sel[g.id]?.size ?? 0;
            const falta = n < g.min_escolhas;
            return (
              <div key={g.id}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-marino">{g.nome}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${falta ? "bg-rojo text-white" : "bg-verde/15 text-verde"}`}>
                    {g.max_escolhas === 1
                      ? "escolha 1"
                      : g.max_escolhas === null
                        ? g.min_escolhas > 0 ? `mínimo ${g.min_escolhas}` : "opcionais"
                        : `${g.min_escolhas}–${g.max_escolhas}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {g.opcoes.map((o) => {
                    const marcado = sel[g.id]?.has(o.id) ?? false;
                    return (
                      <button
                        key={o.id}
                        onClick={() => toggle(g.id, o.id, g.max_escolhas)}
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                          marcado ? "border-transparent bg-marino text-white" : "border-border text-marino hover:bg-black/5"
                        }`}
                      >
                        <span>{o.nome}</span>
                        {o.preco_adicional > 0 && (
                          <span className={marcado ? "text-amarillo" : "text-verde"}>+{brl(o.preco_adicional)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 border-t border-border p-4">
          <button onClick={onCancelar} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!valido}
            className="flex-[2] rounded-lg bg-rojo py-2 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-50"
          >
            Adicionar {brl(precoUnit)}
          </button>
        </div>
      </div>
    </div>
  );
}
