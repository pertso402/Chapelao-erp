"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProdutoComOpcoes } from "@/lib/catalog/queries";
import type { EmpresaPdv } from "@/lib/b2b/queries";
import { buscarClientePorTelefone, criarPedidoBalcao } from "@/lib/orders/pdv-actions";
import { buscarComandaPorMesa } from "@/lib/mesas/actions";
import { MontagemModal } from "@/components/orders/MontagemModal";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export type LinhaCarrinho = {
  key: string;
  produto_id: string;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  opcoes: { option_id: string; nome: string; preco: number }[];
  composicao?: string;
};

export function PdvForm({ produtos, empresas = [], mesaInicial }: { produtos: ProdutoComOpcoes[]; empresas?: EmpresaPdv[]; mesaInicial?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mesa, setMesa] = useState(mesaInicial ?? "");
  const [comandaId, setComandaId] = useState<string | null>(null);

  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"retirada" | "delivery">("retirada");
  const [endereco, setEndereco] = useState("");
  const [pagamento, setPagamento] = useState("dinheiro");
  const [carrinho, setCarrinho] = useState<LinhaCarrinho[]>([]);
  const [busca, setBusca] = useState("");
  const [montando, setMontando] = useState<ProdutoComOpcoes | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");

  const empresa = empresas.find((e) => e.id === empresaId);
  const pctDesconto = empresa?.percentual_desconto ?? 0;

  const categorias = useMemo(() => {
    const filtro = busca.trim().toLowerCase();
    const arr = filtro ? produtos.filter((p) => p.nome.toLowerCase().includes(filtro)) : produtos;
    const g: Record<string, ProdutoComOpcoes[]> = {};
    for (const p of arr) (g[p.categoria || "Outros"] ||= []).push(p);
    return g;
  }, [produtos, busca]);

  const subtotal = carrinho.reduce((s, l) => s + l.preco_unitario * l.quantidade, 0);
  const descontoB2B = Number(((subtotal * pctDesconto) / 100).toFixed(2));
  const totalComDesconto = subtotal - descontoB2B;

  function adicionarProduto(p: ProdutoComOpcoes) {
    if (p.grupos.length > 0) {
      setMontando(p); // abre montagem guiada
      return;
    }
    // produto simples: agrupa por produto
    setCarrinho((c) => {
      const existe = c.find((l) => l.produto_id === p.id && l.opcoes.length === 0);
      if (existe) return c.map((l) => (l === existe ? { ...l, quantidade: l.quantidade + 1 } : l));
      return [...c, { key: crypto.randomUUID(), produto_id: p.id, nome: p.nome, preco_unitario: p.preco, quantidade: 1, opcoes: [] }];
    });
  }

  function confirmarMontagem(linha: LinhaCarrinho) {
    setCarrinho((c) => [...c, linha]);
    setMontando(null);
  }

  const setQtd = (key: string, delta: number) =>
    setCarrinho((c) =>
      c
        .map((l) => (l.key === key ? { ...l, quantidade: l.quantidade + delta } : l))
        .filter((l) => l.quantidade > 0),
    );

  // Importa os itens da comanda de uma mesa para a comanda do PDV.
  const importarMesa = useCallback((numero: string) => {
    if (!numero.trim()) return;
    startTransition(async () => {
      const r = await buscarComandaPorMesa(Number(numero));
      if (!r.ok) {
        setMsg(r.erro);
        setComandaId(null);
        return;
      }
      setCarrinho(
        r.itens.map((i) => ({
          key: crypto.randomUUID(),
          produto_id: i.produto_id,
          nome: i.nome,
          preco_unitario: i.preco_unitario,
          quantidade: i.quantidade,
          opcoes: i.opcoes,
          composicao: i.composicao,
        })),
      );
      setComandaId(r.comanda_id);
      setMsg(`Mesa ${r.numero_mesa} carregada (${r.itens.length} itens).`);
    });
  }, []);

  // Se veio de /pdv?mesa=N, já carrega a comanda.
  useEffect(() => {
    if (mesaInicial) importarMesa(mesaInicial);
  }, [mesaInicial, importarMesa]);

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
        itens: carrinho.map((l) => ({
          produto_id: l.produto_id,
          nome: l.nome,
          preco_unitario: l.preco_unitario,
          quantidade: l.quantidade,
          opcoes: l.opcoes,
          composicao: l.composicao,
        })),
        company_id: empresaId || null,
        company_employee_id: funcionarioId || null,
        percentual_desconto: pctDesconto,
        comanda_id: comandaId,
      });
      if (!r.ok) {
        setMsg(r.erro);
        return;
      }
      setSucesso(`Pedido #${r.numeroPedido} criado! Total ${brl(r.total)}`);
      setCarrinho([]);
      setNome("");
      setTelefone("");
      setEndereco("");
      setEmpresaId("");
      setFuncionarioId("");
      setMesa("");
      setComandaId(null);
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
                    onClick={() => adicionarProduto(p)}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition hover:border-azul hover:bg-azul/5"
                  >
                    <span className="font-medium text-marino">
                      {p.nome}
                      {p.grupos.length > 0 && (
                        <span className="ml-1 rounded bg-amarillo px-1 text-[10px] font-bold text-marino">montar</span>
                      )}
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
        <h2 className="font-extrabold text-marino">Comanda</h2>

        {/* Importar mesa */}
        <div className={`rounded-lg p-2 ${comandaId ? "bg-verde/10" : "bg-black/[0.03]"}`}>
          <div className="mb-1 text-xs font-bold text-marino">
            {comandaId ? `🍽️ Mesa ${mesa} carregada` : "🍽️ Fechar mesa"}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && importarMesa(mesa)}
              placeholder="Nº da mesa"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
            />
            <button
              onClick={() => importarMesa(mesa)}
              disabled={pending || !mesa}
              className="shrink-0 rounded-lg bg-marino px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Carregar
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
          />
          <button onClick={buscarCliente} disabled={pending} className="shrink-0 rounded-lg bg-azul px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Buscar
          </button>
        </div>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul" />

        <div className="flex gap-2 text-sm">
          {(["retirada", "delivery"] as const).map((t) => (
            <button key={t} onClick={() => setTipoEntrega(t)} className={`flex-1 rounded-lg border px-3 py-1.5 font-medium transition ${tipoEntrega === t ? "border-transparent bg-marino text-white" : "border-border text-marino"}`}>
              {t === "retirada" ? "🏪 Retirada" : "🛵 Entrega"}
            </button>
          ))}
        </div>
        {tipoEntrega === "delivery" && (
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço de entrega" className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul" />
        )}

        <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul">
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">PIX</option>
          <option value="cartao">Cartão</option>
        </select>

        {empresas.length > 0 && (
          <div className="rounded-lg bg-azul/5 p-2">
            <div className="mb-1 text-xs font-bold text-azul">Pedido corporativo (B2B)</div>
            <select
              value={empresaId}
              onChange={(e) => { setEmpresaId(e.target.value); setFuncionarioId(""); }}
              className="mb-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
            >
              <option value="">— Sem empresa —</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}{e.percentual_desconto > 0 ? ` (${e.percentual_desconto}%)` : ""}</option>
              ))}
            </select>
            {empresa && (
              <select
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
              >
                <option value="">— Funcionário —</option>
                {empresa.funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="min-h-[60px] space-y-2 border-y border-border py-2 text-sm">
          {carrinho.length === 0 ? (
            <p className="text-muted">Toque nos produtos para adicionar.</p>
          ) : (
            carrinho.map((l) => (
              <div key={l.key} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-marino">{l.nome}</div>
                  {l.composicao && <div className="text-[11px] text-muted">{l.composicao}</div>}
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <button onClick={() => setQtd(l.key, -1)} className="h-6 w-6 rounded bg-black/5 font-bold">−</button>
                  <span className="w-5 text-center">{l.quantidade}</span>
                  <button onClick={() => setQtd(l.key, 1)} className="h-6 w-6 rounded bg-black/5 font-bold">+</button>
                  <span className="w-16 text-right font-semibold text-verde">{brl(l.preco_unitario * l.quantidade)}</span>
                </span>
              </div>
            ))
          )}
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold text-marino">{brl(subtotal)}</span>
          </div>
          {descontoB2B > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-verde">
                <span>Desconto B2B ({pctDesconto}%)</span>
                <span>− {brl(descontoB2B)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-1">
                <span className="text-sm text-muted">Total</span>
                <span className="text-lg font-extrabold text-marino">{brl(totalComDesconto)}</span>
              </div>
            </>
          )}
        </div>

        {msg && <p className="rounded-lg bg-amarillo/20 px-3 py-2 text-sm text-marino">{msg}</p>}
        {sucesso && <p className="rounded-lg bg-verde/15 px-3 py-2 text-sm font-semibold text-verde">{sucesso}</p>}

        <button onClick={fechar} disabled={pending || carrinho.length === 0} className="rounded-lg bg-rojo px-4 py-2.5 font-bold text-white transition hover:brightness-95 disabled:opacity-50">
          {pending ? "Salvando…" : "Fechar pedido"}
        </button>
      </div>

      {montando && (
        <MontagemModal
          produto={montando}
          onCancelar={() => setMontando(null)}
          onConfirmar={confirmarMontagem}
        />
      )}
    </div>
  );
}
