"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProdutoComOpcoes } from "@/lib/catalog/queries";
import type { Comanda } from "@/lib/mesas/queries";
import type { LinhaCarrinho } from "@/components/orders/PdvForm";
import { MontagemModal } from "@/components/orders/MontagemModal";
import { adicionarItemComanda, removerItemComanda, cancelarComanda } from "@/lib/mesas/actions";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ComandaClient({ comanda, produtos }: { comanda: Comanda; produtos: ProdutoComOpcoes[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const [montando, setMontando] = useState<ProdutoComOpcoes | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const f = busca.trim().toLowerCase();
    const arr = f ? produtos.filter((p) => p.nome.toLowerCase().includes(f)) : produtos;
    const g: Record<string, ProdutoComOpcoes[]> = {};
    for (const p of arr) (g[p.categoria || "Outros"] ||= []).push(p);
    return g;
  }, [produtos, busca]);

  function adicionar(p: ProdutoComOpcoes) {
    if (p.grupos.length > 0) { setMontando(p); return; }
    salvar({ key: "", produto_id: p.id, nome: p.nome, preco_unitario: p.preco, quantidade: 1, opcoes: [] });
  }

  function salvar(linha: LinhaCarrinho) {
    setMsg(null);
    startTransition(async () => {
      const r = await adicionarItemComanda({
        comanda_id: comanda.id,
        produto_id: linha.produto_id,
        nome_produto: linha.nome,
        quantidade: linha.quantidade,
        preco_unitario: linha.preco_unitario,
        composicao: linha.composicao,
        opcoes: linha.opcoes,
      });
      if (!r.ok) setMsg(r.erro);
      setMontando(null);
      router.refresh();
    });
  }

  function remover(id: string) {
    startTransition(async () => {
      await removerItemComanda(id, comanda.id);
      router.refresh();
    });
  }

  function cancelar() {
    if (!confirm(`Cancelar a mesa ${comanda.numero_mesa}? Os itens serão descartados.`)) return;
    startTransition(async () => {
      await cancelarComanda(comanda.id);
      router.push("/mesas");
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      {/* Cardápio */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto…"
          className="mb-3 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
        />
        <div className="space-y-4">
          {Object.entries(categorias).map(([cat, itens]) => (
            <div key={cat}>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">{cat}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {itens.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => adicionar(p)}
                    disabled={pending}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-3 text-left text-sm transition hover:border-azul hover:bg-azul/5 disabled:opacity-50"
                  >
                    <span className="font-medium text-marino">
                      {p.nome}
                      {p.grupos.length > 0 && <span className="ml-1 rounded bg-amarillo px-1 text-[10px] font-bold text-marino">montar</span>}
                    </span>
                    <span className="ml-2 shrink-0 font-bold text-verde">{brl(p.preco)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comanda */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-extrabold text-marino">Mesa {comanda.numero_mesa}</h2>
          <span className="text-xs text-muted">{comanda.itens.length} itens</span>
        </div>

        <div className="min-h-[80px] space-y-2 border-y border-border py-2 text-sm">
          {comanda.itens.length === 0 ? (
            <p className="text-muted">Nenhum item ainda. Toque nos produtos.</p>
          ) : (
            comanda.itens.map((i) => (
              <div key={i.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-marino">{i.quantidade}× {i.nome_produto}</div>
                  {i.composicao && <div className="text-[11px] text-muted">{i.composicao}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-verde">{brl(i.total)}</span>
                  <button onClick={() => remover(i.id)} disabled={pending} className="text-xs text-rojo hover:underline">×</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Total</span>
          <span className="text-2xl font-extrabold text-marino">{brl(comanda.total)}</span>
        </div>

        {msg && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{msg}</p>}

        <Link
          href={`/pdv?mesa=${comanda.numero_mesa}`}
          className="rounded-lg bg-verde px-4 py-3 text-center font-bold text-white transition hover:brightness-95"
        >
          Fechar no PDV →
        </Link>
        <button onClick={cancelar} disabled={pending} className="text-xs text-rojo hover:underline">
          Cancelar mesa
        </button>
      </div>

      {montando && (
        <MontagemModal produto={montando} onCancelar={() => setMontando(null)} onConfirmar={salvar} />
      )}
    </div>
  );
}
