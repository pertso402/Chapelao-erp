"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { alternarDisponibilidade, excluirProduto } from "@/lib/catalog/actions";

export function ProdutoDeleteButton({ id, disponivel }: { id: string; disponivel: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function alternar() {
    setErro(null);
    startTransition(async () => {
      const r = await alternarDisponibilidade(id, !disponivel);
      if (!r.ok) setErro(r.erro);
      router.refresh();
    });
  }

  function excluir() {
    if (!window.confirm("Excluir este produto definitivamente? Essa ação não pode ser desfeita.")) return;
    setErro(null);
    startTransition(async () => {
      const r = await excluirProduto(id);
      if (!r.ok) return setErro(r.erro);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          onClick={alternar}
          disabled={pending}
          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
            disponivel ? "border-border text-marino hover:bg-black/5" : "border-verde text-verde hover:bg-verde/10"
          }`}
        >
          {disponivel ? "Desativar" : "Reativar"}
        </button>
        <button
          onClick={excluir}
          disabled={pending}
          className="rounded-lg border border-rojo px-2.5 py-1 text-xs font-semibold text-rojo transition hover:bg-rojo/10 disabled:opacity-50"
        >
          🗑️ Excluir
        </button>
      </div>
      {erro && <p className="max-w-[220px] text-right text-[11px] text-rojo">{erro}</p>}
    </div>
  );
}
