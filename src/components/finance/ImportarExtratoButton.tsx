"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importarExtrato } from "@/lib/finance/conciliacao-actions";

export function ImportarExtratoButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onArquivo(file: File) {
    setErro(null);
    setSucesso(null);
    const texto = await file.text();
    startTransition(async () => {
      const r = await importarExtrato({ nomeArquivo: file.name, texto });
      if (fileRef.current) fileRef.current.value = "";
      if (!r.ok) { setErro(r.erro); return; }
      const duplicadas = r.totalLidas - r.novas;
      setSucesso(`${r.novas} linha(s) nova(s) importada(s)${duplicadas > 0 ? ` (${duplicadas} já existia(m), ignoradas)` : ""}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer rounded-lg border border-azul px-4 py-2 text-sm font-semibold text-azul transition hover:bg-azul/10">
        {pending ? "Lendo…" : "📥 Importar extrato (OFX/CSV)"}
        <input
          ref={fileRef}
          type="file"
          accept=".ofx,.csv,text/csv"
          className="hidden"
          disabled={pending}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onArquivo(f); }}
        />
      </label>
      {erro && <span className="text-xs font-semibold text-rojo">{erro}</span>}
      {sucesso && <span className="text-xs font-semibold text-verde">{sucesso}</span>}
    </div>
  );
}
