"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarItensDoDia } from "@/lib/porcionamento/actions";
import type { ItemCatalogo } from "@/lib/porcionamento/shared";

const CATEGORIA_LABEL: Record<string, string> = {
  carne: "Carnes",
  base: "Base (arroz/feijão)",
  acompanhamento: "Acompanhamentos",
};

function mesmoConjunto(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function ItensDoDiaForm({
  catalogo,
  ativosIniciais,
  isFallback,
  dataFallback,
}: {
  catalogo: ItemCatalogo[];
  ativosIniciais: string[];
  isFallback: boolean;
  dataFallback: string;
}) {
  const router = useRouter();
  const [ativos, setAtivos] = useState(new Set(ativosIniciais));
  // O que está confirmado como salvo pra HOJE. Se veio do fallback (ontem),
  // ainda não é um salvo de hoje de verdade — só um ponto de partida.
  const [salvo, setSalvo] = useState(new Set(ativosIniciais));
  const [salvoHoje, setSalvoHoje] = useState(!isFallback);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const semAlteracoes = salvoHoje && mesmoConjunto(ativos, salvo);

  const grupos = new Map<string, ItemCatalogo[]>();
  for (const item of catalogo) {
    if (!grupos.has(item.categoria)) grupos.set(item.categoria, []);
    grupos.get(item.categoria)!.push(item);
  }

  function toggle(id: string) {
    setAtivos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function marcarTodos(itens: ItemCatalogo[], valor: boolean) {
    setAtivos((prev) => {
      const next = new Set(prev);
      for (const i of itens) valor ? next.add(i.id) : next.delete(i.id);
      return next;
    });
  }

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await salvarItensDoDia([...ativos]);
      if (!r.ok) return setErro(r.erro);
      setSalvo(new Set(ativos));
      setSalvoHoje(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {isFallback && !salvoHoje && (
        <div className="rounded-xl bg-amarillo/20 px-4 py-3 text-sm text-marino">
          Hoje ainda não foi configurado — mostrando os itens de <strong>{new Date(dataFallback + "T00:00:00").toLocaleDateString("pt-BR")}</strong>. Confira e clique em salvar para confirmar hoje.
        </div>
      )}

      {[...grupos.entries()].map(([categoria, itens]) => (
        <section key={categoria} className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-marino">{CATEGORIA_LABEL[categoria] ?? categoria}</h2>
            <div className="flex gap-2 text-xs">
              <button onClick={() => marcarTodos(itens, true)} className="rounded-lg border border-border px-2 py-1 font-semibold text-verde">Marcar todos</button>
              <button onClick={() => marcarTodos(itens, false)} className="rounded-lg border border-border px-2 py-1 font-semibold text-rojo">Desmarcar todos</button>
            </div>
          </div>
          <div className="space-y-1.5">
            {itens.map((item) => (
              <label key={item.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-black/5">
                <input
                  type="checkbox"
                  checked={ativos.has(item.id)}
                  onChange={() => toggle(item.id)}
                  className="h-5 w-5 accent-[var(--chap-verde)]"
                />
                <span className="flex-1 text-sm font-medium text-marino">{item.nome}</span>
                {item.pendentePeso && (
                  <span className="rounded-full bg-marino/10 px-2 py-0.5 text-[10px] font-bold text-marino">peso pendente</span>
                )}
                {item.pendentePreco && (
                  <span className="rounded-full bg-rojo/10 px-2 py-0.5 text-[10px] font-bold text-rojo">preço pendente</span>
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className={`flex-1 text-sm font-medium ${erro ? "text-rojo" : semAlteracoes ? "text-verde" : "text-rojo"}`}>
            {erro
              ? erro
              : semAlteracoes
                ? "✓ Itens de hoje salvos — nada pendente."
                : "● Você tem alterações não salvas."}
          </span>
          <button
            onClick={salvar}
            disabled={pending || semAlteracoes}
            className={`ml-auto shrink-0 rounded-xl px-6 py-3 text-sm font-bold transition disabled:cursor-default ${
              semAlteracoes
                ? "bg-verde/15 text-verde disabled:opacity-100"
                : "bg-rojo text-white hover:brightness-95 disabled:opacity-50"
            }`}
          >
            {pending ? "Salvando…" : semAlteracoes ? "✓ Tudo salvo" : "Salvar itens de hoje"}
          </button>
        </div>
      </div>
    </div>
  );
}
