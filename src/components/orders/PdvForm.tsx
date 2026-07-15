"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarClientePorTelefone, criarPedidoBalcao } from "@/lib/orders/pdv-actions";

type Produto = { id: string; nome: string; categoria: string | null; preco: number };

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PdvForm({ produtos }: { produtos: Produto[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"retirada" | "delivery">("retirada");
  const [endereco, setEndereco] = useState("");
  const [pagamento, setPagamento] = useState("dinheiro");
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const filtro = busca.trim().toLowerCase();
    const arr = filtro
      ? produtos.filter((p) => p.nome.toLowerCase().includes(filtro))
      : produtos;
    const g: Record<string, Produto[]> = {};
    for (const p of arr) (g[p.categoria || "Outros"] ||= []).push(p);
    return g;
  }, [produtos, busca]);

  const itensCarrinho = Object.entries(carrinho)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => {
      const p = produtos.find((x) => x.id === id)!;
      return { ...p, quantidade: q };
    });
  const subtotal = itensCarrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);

  const setQtd = (id: string, delta: number) =>
    setCarrinho((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) }));

  function buscarCliente() {
    if (!telefone.trim()) return;
    startTransition(async () => {
      const r = await buscarClientePorTelefone(telefone);
      if (r.encontrado) {
        setNome(r.nome ?? "");
        if (r.endereco) setEndereco(r.endereco);
        setMsg("Cliente encontrado ✅");
      } else {
        setMsg("Cliente novo — preencha o nome.");
      }
    });
  }

  function fechar() {
    setMsg(null);
    setSucesso(null);
    startTransition(async () => {
      const r = await criarPedidoBalcao({
        nome,
        telefone,
        tipo_entrega: tipoEntrega,
        endereco,
        forma_pagamento: pagamento,
        itens: itensCarrinho.map((i) => ({
          produto_id: i.id,
          nome: i.nome,
          preco_unitario: i.preco,
          quantidade: i.quantidade,
        })),
      });
      if (!r.ok) {
        setMsg(r.erro);
        return;
      }
      setSucesso(`Pedido #${r.numeroPedido} criado! Total ${brl(r.total)}`);
      setCarrinho({});
      setNome("");
      setTelefone("");
      setEndereco("");
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      {/* Cardápio */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto…"
          className="mb-3 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
        />
        {produtos.length === 0 && (
          <p className="text-sm text-muted">Nenhum produto cadastrado no cardápio ainda.</p>
        )}
        <div className="space-y-4">
          {Object.entries(categorias).map(([cat, itens]) => (
            <div key={cat}>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">{cat}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {itens.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setQtd(p.id, 1)}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition hover:border-azul hover:bg-azul/5"
                  >
                    <span className="font-medium text-marino">{p.nome}</span>
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
        <h2 className="font-extrabold text-marino">Comanda</h2>

        <div className="flex gap-2">
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
          />
          <button
            onClick={buscarCliente}
            disabled={pending}
            className="shrink-0 rounded-lg bg-azul px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Buscar
          </button>
        </div>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do cliente"
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
        />

        <div className="flex gap-2 text-sm">
          {(["retirada", "delivery"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoEntrega(t)}
              className={`flex-1 rounded-lg border px-3 py-1.5 font-medium transition ${
                tipoEntrega === t ? "border-transparent bg-marino text-white" : "border-border text-marino"
              }`}
            >
              {t === "retirada" ? "🏪 Retirada" : "🛵 Entrega"}
            </button>
          ))}
        </div>
        {tipoEntrega === "delivery" && (
          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço de entrega"
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
          />
        )}

        <select
          value={pagamento}
          onChange={(e) => setPagamento(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
        >
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">PIX</option>
          <option value="cartao">Cartão</option>
        </select>

        <div className="min-h-[60px] space-y-1 border-y border-border py-2 text-sm">
          {itensCarrinho.length === 0 ? (
            <p className="text-muted">Toque nos produtos para adicionar.</p>
          ) : (
            itensCarrinho.map((i) => (
              <div key={i.id} className="flex items-center justify-between">
                <span className="text-marino">{i.nome}</span>
                <span className="flex items-center gap-2">
                  <button onClick={() => setQtd(i.id, -1)} className="h-6 w-6 rounded bg-black/5 font-bold">−</button>
                  <span className="w-5 text-center">{i.quantidade}</span>
                  <button onClick={() => setQtd(i.id, 1)} className="h-6 w-6 rounded bg-black/5 font-bold">+</button>
                  <span className="w-16 text-right font-semibold text-verde">{brl(i.preco * i.quantidade)}</span>
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="text-lg font-extrabold text-marino">{brl(subtotal)}</span>
        </div>

        {msg && <p className="rounded-lg bg-amarillo/20 px-3 py-2 text-sm text-marino">{msg}</p>}
        {sucesso && <p className="rounded-lg bg-verde/15 px-3 py-2 text-sm font-semibold text-verde">{sucesso}</p>}

        <button
          onClick={fechar}
          disabled={pending || itensCarrinho.length === 0}
          className="rounded-lg bg-rojo px-4 py-2.5 font-bold text-white transition hover:brightness-95 disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Fechar pedido"}
        </button>
      </div>
    </div>
  );
}
