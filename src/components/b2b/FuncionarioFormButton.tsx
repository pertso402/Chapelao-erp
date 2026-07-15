"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarFuncionario } from "@/lib/b2b/actions";
import type { Funcionario } from "@/lib/b2b/queries";

export function FuncionarioFormButton({
  companyId,
  funcionario,
}: {
  companyId: string;
  funcionario?: Funcionario;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState({
    nome: funcionario?.nome ?? "",
    telefone: funcionario?.telefone ?? "",
    matricula: funcionario?.matricula ?? "",
    setor: funcionario?.setor ?? "",
    limite_mensal: String(funcionario?.limite_mensal ?? 0),
    limite_diario: String(funcionario?.limite_diario ?? 0),
  });
  const upd = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await salvarFuncionario({
        id: funcionario?.id,
        company_id: companyId,
        nome: f.nome,
        telefone: f.telefone,
        matricula: f.matricula,
        setor: f.setor,
        limite_mensal: Number(f.limite_mensal) || 0,
        limite_diario: Number(f.limite_diario) || 0,
      });
      if (!r.ok) return setErro(r.erro);
      setAberto(false);
      router.refresh();
    });
  }

  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className={
          funcionario
            ? "text-xs font-semibold text-azul hover:underline"
            : "rounded-lg bg-marino px-3 py-1.5 text-sm font-semibold text-white"
        }
      >
        {funcionario ? "editar" : "+ Funcionário"}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-2 p-5">
              <h2 className="font-extrabold text-marino">{funcionario ? "Editar funcionário" : "Novo funcionário"}</h2>
              <input className={input} placeholder="Nome *" value={f.nome} onChange={(e) => upd("nome", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className={input} placeholder="Telefone" value={f.telefone} onChange={(e) => upd("telefone", e.target.value)} />
                <input className={input} placeholder="Matrícula" value={f.matricula} onChange={(e) => upd("matricula", e.target.value)} />
              </div>
              <input className={input} placeholder="Setor" value={f.setor} onChange={(e) => upd("setor", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted">Limite mensal (R$)
                  <input className={input} type="number" value={f.limite_mensal} onChange={(e) => upd("limite_mensal", e.target.value)} />
                </label>
                <label className="text-xs text-muted">Limite diário (R$)
                  <input className={input} type="number" value={f.limite_diario} onChange={(e) => upd("limite_diario", e.target.value)} />
                </label>
              </div>
              {erro && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
                <button onClick={salvar} disabled={pending} className="flex-[2] rounded-lg bg-marino py-2 text-sm font-bold text-white disabled:opacity-50">
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
