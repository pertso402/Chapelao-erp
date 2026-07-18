"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarProduto, atualizarProduto, type ProdutoInput } from "@/lib/catalog/actions";

type ProdutoEditavel = {
  id: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  preco_base: number;
  preco_promocional: number | null;
  disponivel: boolean;
  destaque: boolean;
};

export function ProdutoFormModal({ produto }: { produto?: ProdutoEditavel }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState({
    nome: produto?.nome ?? "",
    categoria: produto?.categoria ?? "",
    descricao: produto?.descricao ?? "",
    preco: produto ? String(produto.preco_base) : "",
    preco_promocional: produto?.preco_promocional != null ? String(produto.preco_promocional) : "",
    disponivel: produto?.disponivel ?? true,
    destaque: produto?.destaque ?? false,
  });
  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  function salvar() {
    setErro(null);
    const payload: ProdutoInput = {
      nome: f.nome,
      categoria: f.categoria,
      descricao: f.descricao,
      preco: Number(f.preco),
      preco_promocional: f.preco_promocional.trim() === "" ? null : Number(f.preco_promocional),
      disponivel: f.disponivel,
      destaque: f.destaque,
    };
    startTransition(async () => {
      const r = produto ? await atualizarProduto(produto.id, payload) : await criarProduto(payload);
      if (!r.ok) return setErro(r.erro);
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <>
      {produto ? (
        <button onClick={() => setAberto(true)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-marino hover:bg-black/5">
          ✏️ Editar
        </button>
      ) : (
        <button onClick={() => setAberto(true)} className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">
          + Novo produto
        </button>
      )}

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="max-h-[80vh] space-y-2 overflow-y-auto p-5">
              <h2 className="font-extrabold text-marino">{produto ? "Editar produto" : "Novo produto"}</h2>
              <input className={input} placeholder="Nome *" value={f.nome} onChange={(e) => upd("nome", e.target.value)} />
              <input className={input} placeholder="Categoria" value={f.categoria} onChange={(e) => upd("categoria", e.target.value)} />
              <textarea className={input} placeholder="Descrição" rows={2} value={f.descricao} onChange={(e) => upd("descricao", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted">Preço *
                  <input className={input} type="number" step="0.01" value={f.preco} onChange={(e) => upd("preco", e.target.value)} />
                </label>
                <label className="text-xs text-muted">Preço promocional
                  <input className={input} type="number" step="0.01" value={f.preco_promocional} onChange={(e) => upd("preco_promocional", e.target.value)} />
                </label>
              </div>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-sm text-marino">
                  <input type="checkbox" checked={f.disponivel} onChange={(e) => upd("disponivel", e.target.checked)} className="h-4 w-4 accent-[var(--chap-verde)]" />
                  Disponível
                </label>
                <label className="flex items-center gap-1.5 text-sm text-marino">
                  <input type="checkbox" checked={f.destaque} onChange={(e) => upd("destaque", e.target.checked)} className="h-4 w-4 accent-[var(--chap-amarillo)]" />
                  Destaque
                </label>
              </div>
              {erro && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
                <button onClick={salvar} disabled={pending} className="flex-[2] rounded-lg bg-rojo py-2 text-sm font-bold text-white disabled:opacity-50">
                  {pending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
