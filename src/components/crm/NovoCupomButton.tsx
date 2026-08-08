"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarCupom } from "@/lib/crm/actions";
import { ClienteCombobox } from "@/components/crm/ClienteCombobox";

type Cliente = { id: string; nome: string; telefone: string };

export function NovoCupomButton({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState({ codigo: "", desconto: "10", validade: "", descricao: "", clienteId: "" });
  const upd = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await criarCupom({
        codigo: f.codigo, desconto_percentual: Number(f.desconto), valido_ate: f.validade,
        descricao: f.descricao, cliente_id: f.clienteId,
      });
      if (!r.ok) return setErro(r.erro);
      setAberto(false);
      setF({ codigo: "", desconto: "10", validade: "", descricao: "", clienteId: "" });
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={() => setAberto(true)} className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">+ Novo cupom</button>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-2 p-5">
              <h2 className="font-extrabold text-marino">Novo cupom</h2>
              <ClienteCombobox clientes={clientes} value={f.clienteId} onChange={(id) => upd("clienteId", id)} />
              <input className={input} placeholder="Código (ex.: VOLTA10)" value={f.codigo} onChange={(e) => upd("codigo", e.target.value.toUpperCase())} />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted">Desconto %<input className={input} type="number" value={f.desconto} onChange={(e) => upd("desconto", e.target.value)} /></label>
                <label className="text-xs text-muted">Válido até<input className={input} type="date" value={f.validade} onChange={(e) => upd("validade", e.target.value)} /></label>
              </div>
              <input className={input} placeholder="Descrição (opcional)" value={f.descricao} onChange={(e) => upd("descricao", e.target.value)} />
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
