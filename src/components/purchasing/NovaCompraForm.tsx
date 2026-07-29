"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarCompra } from "@/lib/purchasing/actions";
import { createClient } from "@/lib/supabase/client";

type Fornecedor = { id: string; nome: string };
type ItemInv = { id: string; nome: string; sigla: string; custo: number };
type Linha = { inventory_item_id: string; quantidade: string; custo_unitario: string };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function NovaCompraForm({ fornecedores, itens }: { fornecedores: Fornecedor[]; itens: ItemInv[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [aberto, setAberto] = useState(false);
  const [fornecedor, setFornecedor] = useState(fornecedores[0]?.id ?? "");
  const [vencimento, setVencimento] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const total = linhas.reduce((s, l) => s + (Number(l.quantidade) || 0) * (Number(l.custo_unitario) || 0), 0);

  function addLinha() {
    const first = itens[0];
    setLinhas((l) => [...l, { inventory_item_id: first?.id ?? "", quantidade: "", custo_unitario: String(first?.custo ?? 0) }]);
  }
  function updLinha(idx: number, campo: keyof Linha, val: string) {
    setLinhas((ls) => ls.map((l, i) => {
      if (i !== idx) return l;
      const nova = { ...l, [campo]: val };
      if (campo === "inventory_item_id") {
        const it = itens.find((x) => x.id === val);
        if (it) nova.custo_unitario = String(it.custo);
      }
      return nova;
    }));
  }
  function rmLinha(idx: number) { setLinhas((ls) => ls.filter((_, i) => i !== idx)); }

  async function confirmar() {
    setMsg(null);
    let anexo_path: string | null = null;
    let anexo_nome: string | null = null;

    if (arquivo) {
      setEnviandoArquivo(true);
      const supabase = createClient();
      const path = `${crypto.randomUUID()}/${arquivo.name}`;
      const { error: upErr } = await supabase.storage.from("compras-documentos").upload(path, arquivo);
      setEnviandoArquivo(false);
      if (upErr) {
        setMsg(`Falha ao enviar o anexo: ${upErr.message}`);
        return;
      }
      anexo_path = path;
      anexo_nome = arquivo.name;
    }

    startTransition(async () => {
      const r = await confirmarCompra({
        supplier_id: fornecedor,
        vencimento: vencimento || null,
        itens: linhas.map((l) => {
          const it = itens.find((x) => x.id === l.inventory_item_id)!;
          return { inventory_item_id: l.inventory_item_id, nome: it?.nome ?? "", quantidade: Number(l.quantidade), custo_unitario: Number(l.custo_unitario) };
        }),
        anexo_path,
        anexo_nome,
      });
      if (!r.ok) { setMsg(r.erro); return; }
      setLinhas([]);
      setVencimento("");
      setArquivo(null);
      if (fileRef.current) fileRef.current.value = "";
      setAberto(false);
      router.refresh();
    });
  }

  const input = "rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-azul";

  if (!aberto) {
    return <button onClick={() => setAberto(true)} className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">+ Nova compra</button>;
  }

  return (
    <div className="rounded-2xl border border-azul bg-card p-4">
      <h2 className="mb-3 font-bold text-marino">Nova compra / recebimento</h2>
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs text-muted">Fornecedor
          <select value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} className={input + " mt-0.5 w-full"}>
            {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted">Vencimento da conta a pagar
          <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className={input + " mt-0.5 w-full"} />
        </label>
      </div>

      <div className="space-y-2">
        {linhas.map((l, idx) => {
          const it = itens.find((x) => x.id === l.inventory_item_id);
          return (
            <div key={idx} className="flex items-end gap-2">
              <label className="flex-1 text-xs text-muted">Item
                <select value={l.inventory_item_id} onChange={(e) => updLinha(idx, "inventory_item_id", e.target.value)} className={input + " mt-0.5 w-full"}>
                  {itens.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
              </label>
              <label className="text-xs text-muted">Qtd ({it?.sigla})
                <input type="number" value={l.quantidade} onChange={(e) => updLinha(idx, "quantidade", e.target.value)} className={input + " w-20"} />
              </label>
              <label className="text-xs text-muted">Custo un.
                <input type="number" value={l.custo_unitario} onChange={(e) => updLinha(idx, "custo_unitario", e.target.value)} className={input + " w-24"} />
              </label>
              <button onClick={() => rmLinha(idx)} className="pb-1.5 text-xs text-rojo hover:underline">remover</button>
            </div>
          );
        })}
      </div>

      <button onClick={addLinha} className="mt-2 text-sm font-semibold text-azul hover:underline">+ adicionar item</button>

      <label className="mt-3 block text-xs text-muted">
        Anexar nota (XML, PDF ou foto) — opcional, fica guardado com a compra
        <input
          ref={fileRef}
          type="file"
          accept=".xml,.pdf,image/*"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="mt-0.5 block w-full text-sm text-marino file:mr-2 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-marino"
        />
      </label>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted">Total da compra</span>
        <span className="text-lg font-extrabold text-marino">{brl(total)}</span>
      </div>

      {msg && <p className="mt-2 rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{msg}</p>}

      <div className="mt-3 flex gap-2">
        <button onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
        <button onClick={confirmar} disabled={pending || enviandoArquivo || linhas.length === 0} className="flex-[2] rounded-lg bg-verde py-2 text-sm font-bold text-white disabled:opacity-50">
          {enviandoArquivo ? "Enviando anexo…" : pending ? "Confirmando…" : "Confirmar (entra no estoque + gera conta a pagar)"}
        </button>
      </div>
    </div>
  );
}
