"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Ficha } from "@/lib/recipes/queries";
import { adicionarIngrediente, removerIngrediente } from "@/lib/recipes/actions";

type ItemInv = { id: string; nome: string; sigla: string; custo: number };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brl4 = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 4 });

export function FichaEditor({ ficha, itensInventario }: { ficha: Ficha; itensInventario: ItemInv[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [novoItem, setNovoItem] = useState(itensInventario[0]?.id ?? "");
  const [qtd, setQtd] = useState("");
  const [precoSim, setPrecoSim] = useState(String(ficha.produto.preco));

  const custo = ficha.custo;
  const preco = Number(precoSim) || 0;
  const margemRs = preco - custo;
  const margemPct = preco > 0 ? (margemRs / preco) * 100 : 0;

  function adicionar() {
    if (!novoItem || !Number(qtd)) return;
    startTransition(async () => {
      await adicionarIngrediente({
        produto_id: ficha.produto.id,
        nome_produto: ficha.produto.nome,
        inventory_item_id: novoItem,
        quantidade: Number(qtd),
      });
      setQtd("");
      router.refresh();
    });
  }

  function remover(id: string) {
    startTransition(async () => {
      await removerIngrediente(id, ficha.produto.id);
      router.refresh();
    });
  }

  const sel = itensInventario.find((i) => i.id === novoItem);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      {/* Ingredientes */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-bold text-marino">Ingredientes</h2>
        {ficha.itens.length === 0 ? (
          <p className="text-sm text-muted">Nenhum ingrediente. Adicione ao lado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-1">Ingrediente</th>
                <th className="pb-1 text-right">Qtd</th>
                <th className="pb-1 text-right">Custo un.</th>
                <th className="pb-1 text-right">Subtotal</th>
                <th className="pb-1"></th>
              </tr>
            </thead>
            <tbody>
              {ficha.itens.map((it) => (
                <tr key={it.recipe_item_id} className="border-t border-border">
                  <td className="py-1.5 font-medium text-marino">{it.nome}</td>
                  <td className="py-1.5 text-right">{it.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} {it.sigla}</td>
                  <td className="py-1.5 text-right text-muted">{brl(it.custo_unit)}</td>
                  <td className="py-1.5 text-right font-semibold text-marino">{brl4(it.subtotal)}</td>
                  <td className="py-1.5 text-right">
                    <button onClick={() => remover(it.recipe_item_id)} disabled={pending} className="text-xs text-rojo hover:underline">remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="pt-2 text-right text-sm font-bold text-marino">Custo teórico</td>
                <td className="pt-2 text-right font-extrabold text-rojo">{brl(custo)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <label className="flex-1 text-xs text-muted">Ingrediente
            <select value={novoItem} onChange={(e) => setNovoItem(e.target.value)} className="mt-0.5 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul">
              {itensInventario.map((i) => <option key={i.id} value={i.id}>{i.nome} ({brl(i.custo)}/{i.sigla})</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">Qtd ({sel?.sigla})
            <input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} className="mt-0.5 w-24 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul" />
          </label>
          <button onClick={adicionar} disabled={pending} className="rounded-lg bg-marino px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Adicionar</button>
        </div>
      </div>

      {/* Custo & margem + simulação */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 font-bold text-marino">Custo & margem</h2>
          <Linha label="Custo teórico" valor={brl(custo)} cor="var(--chap-rojo)" />
          <Linha label="Preço de venda" valor={brl(ficha.produto.preco)} cor="var(--chap-marino)" />
          <Linha label="Margem" valor={`${brl(ficha.produto.preco - custo)} (${(((ficha.produto.preco - custo) / (ficha.produto.preco || 1)) * 100).toFixed(1)}%)`} cor="var(--chap-verde)" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 font-bold text-marino">Simular preço</h2>
          <input type="number" value={precoSim} onChange={(e) => setPrecoSim(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul" />
          <div className="mt-2">
            <Linha label="Margem simulada" valor={`${brl(margemRs)} (${margemPct.toFixed(1)}%)`} cor={margemRs >= 0 ? "var(--chap-verde)" : "var(--chap-rojo)"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Linha({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-bold" style={{ color: cor }}>{valor}</span>
    </div>
  );
}
