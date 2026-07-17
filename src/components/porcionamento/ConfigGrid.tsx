"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { salvarQuantidadeConfig } from "@/lib/porcionamento/actions";
import { labelTipo, TETO_CMV, type ConfigPorcionamento, type ItemCatalogo, type Tamanho } from "@/lib/porcionamento/shared";

const CATEGORIA_LABEL: Record<string, string> = {
  carne: "Carnes",
  base: "Base (arroz/feijão)",
  acompanhamento: "Acompanhamentos",
};

const TAMANHOS: Tamanho[] = ["P", "M", "G"];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ConfigGrid({
  catalogo,
  configInicial,
  lacunas,
}: {
  catalogo: ItemCatalogo[];
  configInicial: ConfigPorcionamento;
  lacunas: Record<Tamanho, number>;
}) {
  const [config, setConfig] = useState(configInicial);
  const [, startTransition] = useTransition();
  const [salvando, setSalvando] = useState<string | null>(null);

  const grupos = useMemo(() => {
    const m = new Map<string, ItemCatalogo[]>();
    for (const item of catalogo) {
      if (!m.has(item.categoria)) m.set(item.categoria, []);
      m.get(item.categoria)!.push(item);
    }
    return m;
  }, [catalogo]);

  const totais = useMemo(() => {
    const t: Record<Tamanho, { custo: number; subestimado: boolean }> = {
      P: { custo: 0, subestimado: false },
      M: { custo: 0, subestimado: false },
      G: { custo: 0, subestimado: false },
    };
    for (const tamanho of TAMANHOS) {
      for (const item of catalogo) {
        const cfg = config[tamanho][item.id];
        if (!cfg || !cfg.ativo || cfg.quantidade <= 0) continue;
        if (item.custoPorPorcao === null) {
          t[tamanho].subestimado = true;
        } else {
          t[tamanho].custo += item.custoPorPorcao * cfg.quantidade;
        }
      }
    }
    return t;
  }, [catalogo, config]);

  function onChange(tamanho: Tamanho, itemId: string, valor: string) {
    const quantidade = valor === "" ? 0 : Number(valor);
    setConfig((prev) => ({
      ...prev,
      [tamanho]: { ...prev[tamanho], [itemId]: { quantidade, ativo: quantidade > 0 } },
    }));
  }

  function salvar(tamanho: Tamanho, itemId: string) {
    const quantidade = config[tamanho][itemId]?.quantidade ?? 0;
    const key = `${tamanho}-${itemId}`;
    setSalvando(key);
    startTransition(async () => {
      await salvarQuantidadeConfig({ tamanho, inventoryItemId: itemId, quantidade });
      setSalvando((cur) => (cur === key ? null : cur));
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TAMANHOS.map((tamanho) => {
          const { custo, subestimado } = totais[tamanho];
          const teto = TETO_CMV[tamanho];
          const acimaDoTeto = custo > teto;
          return (
            <div key={tamanho} className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs text-muted">Custo estimado — {tamanho}</div>
              <div className={`mt-1 text-xl font-extrabold ${acimaDoTeto ? "text-rojo" : "text-verde"}`}>
                {brl(custo)} <span className="text-xs font-normal text-muted">/ teto {brl(teto)}</span>
              </div>
              {subestimado && <div className="mt-1 text-[11px] font-semibold text-rojo">⚠ inclui item(ns) sem preço — total subestimado</div>}
              {lacunas[tamanho] > 0 && (
                <div className="mt-1 text-[11px] text-muted">{lacunas[tamanho]} item(ns) ativo(s) hoje sem configuração aqui</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="p-3">Item</th>
              <th className="p-3">Unidade</th>
              {TAMANHOS.map((t) => (
                <th key={t} className="p-3 text-center">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...grupos.entries()].map(([categoria, itens]) => (
              <Fragment key={categoria}>
                <tr className="border-b border-border bg-background">
                  <td colSpan={5} className="p-2 px-3 text-xs font-bold uppercase text-muted">{CATEGORIA_LABEL[categoria] ?? categoria}</td>
                </tr>
                {itens.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-marino">{item.nome}</td>
                    <td className="p-3 text-muted">{labelTipo(item.tipo)}</td>
                    {TAMANHOS.map((tamanho) => {
                      const key = `${tamanho}-${item.id}`;
                      return (
                        <td key={tamanho} className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            step="0.5"
                            value={config[tamanho][item.id]?.quantidade || ""}
                            onChange={(e) => onChange(tamanho, item.id, e.target.value)}
                            onBlur={() => salvar(tamanho, item.id)}
                            className="w-16 rounded-lg border border-border px-2 py-1.5 text-center outline-none focus:border-azul"
                          />
                          {salvando === key && <span className="ml-1 text-[10px] text-muted">…</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
