"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarFornecedor } from "@/lib/purchasing/actions";

export function NovoFornecedorButton() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState({ nome: "", cnpj: "", whatsapp: "", contato: "" });
  const upd = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await criarFornecedor(f);
      if (!r.ok) return setErro(r.erro);
      setAberto(false);
      setF({ nome: "", cnpj: "", whatsapp: "", contato: "" });
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={() => setAberto(true)} className="rounded-lg border border-azul px-4 py-2 text-sm font-semibold text-azul transition hover:bg-azul/10">
        + Novo fornecedor
      </button>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-2 p-5">
              <h2 className="font-extrabold text-marino">Novo fornecedor</h2>
              <input className={input} placeholder="Nome *" value={f.nome} onChange={(e) => upd("nome", e.target.value)} autoFocus />
              <input className={input} placeholder="CNPJ (opcional)" value={f.cnpj} onChange={(e) => upd("cnpj", e.target.value)} />
              <input className={input} placeholder="WhatsApp (opcional)" value={f.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} />
              <input className={input} placeholder="Contato / vendedor (opcional)" value={f.contato} onChange={(e) => upd("contato", e.target.value)} />
              {erro && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
                <button onClick={salvar} disabled={pending || !f.nome.trim()} className="flex-[2] rounded-lg bg-marino py-2 text-sm font-bold text-white disabled:opacity-50">
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
