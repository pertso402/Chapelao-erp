"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarItemEstoque } from "@/lib/inventory/actions";

export function NovoItemButton({ medidas }: { medidas: { id: string; sigla: string }[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState({ nome: "", categoria: "", measure_id: medidas[0]?.id ?? "", estoque_minimo: "0", custo_atual: "0", entrada_inicial: "0" });
  const upd = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await criarItemEstoque({
        nome: f.nome, categoria: f.categoria, measure_id: f.measure_id,
        estoque_minimo: Number(f.estoque_minimo), custo_atual: Number(f.custo_atual), entrada_inicial: Number(f.entrada_inicial),
      });
      if (!r.ok) return setErro(r.erro);
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={() => setAberto(true)} className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">+ Novo item</button>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-2 p-5">
              <h2 className="font-extrabold text-marino">Novo item de estoque</h2>
              <input className={input} placeholder="Nome *" value={f.nome} onChange={(e) => upd("nome", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className={input} placeholder="Categoria" value={f.categoria} onChange={(e) => upd("categoria", e.target.value)} />
                <select className={input} value={f.measure_id} onChange={(e) => upd("measure_id", e.target.value)}>
                  {medidas.map((m) => <option key={m.id} value={m.id}>{m.sigla}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-muted">Mínimo<input className={input} type="number" value={f.estoque_minimo} onChange={(e) => upd("estoque_minimo", e.target.value)} /></label>
                <label className="text-xs text-muted">Custo un.<input className={input} type="number" value={f.custo_atual} onChange={(e) => upd("custo_atual", e.target.value)} /></label>
                <label className="text-xs text-muted">Entrada<input className={input} type="number" value={f.entrada_inicial} onChange={(e) => upd("entrada_inicial", e.target.value)} /></label>
              </div>
              {erro && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
                <button onClick={salvar} disabled={pending} className="flex-[2] rounded-lg bg-rojo py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "Salvando…" : "Criar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
