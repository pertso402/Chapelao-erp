"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarDespesa } from "@/lib/finance/actions";

type Conta = { id: string; nome: string; tipo: string };
type Centro = { id: string; nome: string };

export function NovaDespesaButton({ contas, centros }: { contas: Conta[]; centros: Centro[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const despesas = contas.filter((c) => c.tipo === "despesa");
  const [f, setF] = useState({ descricao: "", valor: "", vencimento: "", account_id: despesas[0]?.id ?? "", cost_center_id: centros[0]?.id ?? "", recorrente: false });
  const upd = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));
  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await criarDespesa({
        descricao: f.descricao, valor: Number(f.valor), vencimento: f.vencimento || null,
        account_id: f.account_id || null, cost_center_id: f.cost_center_id || null, recorrente: f.recorrente,
      });
      if (!r.ok) return setErro(r.erro);
      setAberto(false);
      setF({ descricao: "", valor: "", vencimento: "", account_id: despesas[0]?.id ?? "", cost_center_id: centros[0]?.id ?? "", recorrente: false });
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={() => setAberto(true)} className="rounded-lg bg-marino px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">+ Nova despesa</button>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-2 p-5">
              <h2 className="font-extrabold text-marino">Nova despesa</h2>
              <input className={input} placeholder="Descrição *" value={f.descricao} onChange={(e) => upd("descricao", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted">Valor (R$)<input className={input} type="number" value={f.valor} onChange={(e) => upd("valor", e.target.value)} /></label>
                <label className="text-xs text-muted">Vencimento<input className={input} type="date" value={f.vencimento} onChange={(e) => upd("vencimento", e.target.value)} /></label>
              </div>
              <label className="block text-xs text-muted">Categoria (plano de contas)
                <select className={input} value={f.account_id} onChange={(e) => upd("account_id", e.target.value)}>
                  {despesas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              <label className="block text-xs text-muted">Centro de custo
                <select className={input} value={f.cost_center_id} onChange={(e) => upd("cost_center_id", e.target.value)}>
                  {centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-marino">
                <input type="checkbox" checked={f.recorrente} onChange={(e) => upd("recorrente", e.target.checked)} /> Despesa recorrente (mensal)
              </label>
              {erro && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
                <button onClick={salvar} disabled={pending} className="flex-[2] rounded-lg bg-marino py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "Salvando…" : "Salvar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
