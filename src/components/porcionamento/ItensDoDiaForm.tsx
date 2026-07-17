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
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

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
    setMsg(null);
    startTransition(async () => {
      const r = await salvarItensDoDia([...ativos]);
      if (!r.ok) return setMsg(`Erro: ${r.erro}`);
      setMsg("Itens de hoje salvos ✓");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {isFallback && (
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
          {msg && <span className="flex-1 text-sm text-muted">{msg}</span>}
          <button
            onClick={salvar}
            disabled={pending}
            className="ml-auto rounded-xl bg-rojo px-6 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Salvar itens de hoje"}
          </button>
        </div>
      </div>
    </div>
  );
}
