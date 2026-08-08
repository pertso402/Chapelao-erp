"use client";

import { useMemo, useState } from "react";

type Cliente = { id: string; nome: string; telefone: string };

export function ClienteCombobox({
  clientes,
  value,
  onChange,
}: {
  clientes: Cliente[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const selecionado = clientes.find((c) => c.id === value);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return clientes.slice(0, 30);
    return clientes.filter((c) => c.nome.toLowerCase().includes(q) || c.telefone.includes(q)).slice(0, 30);
  }, [clientes, busca]);

  return (
    <div className="relative">
      <input
        value={aberto ? busca : selecionado ? `${selecionado.nome} — ${selecionado.telefone}` : ""}
        onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
        onFocus={() => { setAberto(true); setBusca(""); }}
        placeholder="Buscar cliente por nome ou telefone…"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul"
      />
      {aberto && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {filtrados.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted">Nenhum cliente encontrado.</div>
          ) : (
            filtrados.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setAberto(false); setBusca(""); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-black/5"
              >
                <span className="font-medium text-marino">{c.nome}</span>
                <span className="ml-2 text-xs text-muted">{c.telefone}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
