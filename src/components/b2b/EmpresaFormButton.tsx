"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarEmpresa } from "@/lib/b2b/actions";
import type { Empresa } from "@/lib/b2b/queries";

export function EmpresaFormButton({ empresa }: { empresa?: Empresa }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [f, setF] = useState({
    razao_social: empresa?.razao_social ?? "",
    nome_fantasia: empresa?.nome_fantasia ?? "",
    cnpj: empresa?.cnpj ?? "",
    whatsapp: empresa?.whatsapp ?? "",
    responsavel_financeiro: empresa?.responsavel_financeiro ?? "",
    percentual_desconto: String(empresa?.percentual_desconto ?? 0),
    dia_fechamento: String(empresa?.dia_fechamento ?? ""),
    dia_vencimento: String(empresa?.dia_vencimento ?? ""),
    limite_credito: String(empresa?.limite_credito ?? 0),
  });
  const upd = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await salvarEmpresa({
        id: empresa?.id,
        razao_social: f.razao_social,
        nome_fantasia: f.nome_fantasia,
        cnpj: f.cnpj,
        whatsapp: f.whatsapp,
        responsavel_financeiro: f.responsavel_financeiro,
        percentual_desconto: Number(f.percentual_desconto) || 0,
        dia_fechamento: f.dia_fechamento ? Number(f.dia_fechamento) : null,
        dia_vencimento: f.dia_vencimento ? Number(f.dia_vencimento) : null,
        limite_credito: Number(f.limite_credito) || 0,
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setAberto(false);
      router.refresh();
      if (!empresa) router.push(`/empresas/${r.id}`);
    });
  }

  const input = "rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="shrink-0 rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
      >
        {empresa ? "Editar" : "+ Nova empresa"}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-auto rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-3 p-5">
              <h2 className="font-extrabold text-marino">{empresa ? "Editar empresa" : "Nova empresa"}</h2>

              <div className="grid grid-cols-1 gap-2">
                <input className={input} placeholder="Razão social *" value={f.razao_social} onChange={(e) => upd("razao_social", e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={input} placeholder="Nome fantasia" value={f.nome_fantasia} onChange={(e) => upd("nome_fantasia", e.target.value)} />
                  <input className={input} placeholder="CNPJ" value={f.cnpj} onChange={(e) => upd("cnpj", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={input} placeholder="WhatsApp financeiro" value={f.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} />
                  <input className={input} placeholder="Responsável financeiro" value={f.responsavel_financeiro} onChange={(e) => upd("responsavel_financeiro", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs text-muted">Desconto %
                    <input className={input + " w-full"} type="number" value={f.percentual_desconto} onChange={(e) => upd("percentual_desconto", e.target.value)} />
                  </label>
                  <label className="text-xs text-muted">Dia fecham.
                    <input className={input + " w-full"} type="number" value={f.dia_fechamento} onChange={(e) => upd("dia_fechamento", e.target.value)} />
                  </label>
                  <label className="text-xs text-muted">Dia vencim.
                    <input className={input + " w-full"} type="number" value={f.dia_vencimento} onChange={(e) => upd("dia_vencimento", e.target.value)} />
                  </label>
                </div>
                <label className="text-xs text-muted">Limite de crédito (R$)
                  <input className={input + " w-full"} type="number" value={f.limite_credito} onChange={(e) => upd("limite_credito", e.target.value)} />
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
