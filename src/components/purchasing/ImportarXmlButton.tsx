"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { preVisualizarXml, confirmarImportacaoXml, type PreviewXml, type ItemConfirmado } from "@/lib/purchasing/nfe-actions";

type ItemInv = { id: string; nome: string; sigla: string; custo: number };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ImportarXmlButton({ itensEstoque }: { itensEstoque: ItemInv[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewXml | null>(null);
  const [xmlText, setXmlText] = useState("");
  const [xmlNome, setXmlNome] = useState("");
  const [mapeamento, setMapeamento] = useState<Record<number, string>>({}); // idx -> inventory_item_id | "" (novo)
  const [vencimento, setVencimento] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPreview(null);
    setXmlText("");
    setXmlNome("");
    setMapeamento({});
    setVencimento("");
    setErro(null);
    setSucesso(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onArquivo(file: File) {
    setErro(null);
    const texto = await file.text();
    setXmlText(texto);
    setXmlNome(file.name);
    startTransition(async () => {
      const r = await preVisualizarXml(texto);
      if (!r.ok) { setErro(r.erro); return; }
      setPreview(r.preview);
      const map: Record<number, string> = {};
      r.preview.itens.forEach((it, i) => { if (it.inventoryItemIdSugerido) map[i] = it.inventoryItemIdSugerido; });
      setMapeamento(map);
      if (r.preview.nfe.duplicatas[0]?.vencimento) setVencimento(r.preview.nfe.duplicatas[0].vencimento);
    });
  }

  function confirmar() {
    if (!preview) return;
    setErro(null);
    const itens: ItemConfirmado[] = preview.itens.map((it, i) => ({
      nome: it.nome,
      quantidade: it.quantidade,
      valorUnitario: it.valorUnitario,
      unidade: it.unidade,
      inventoryItemId: mapeamento[i] || null,
    }));
    startTransition(async () => {
      const r = await confirmarImportacaoXml({
        xmlText,
        xmlNomeArquivo: xmlNome,
        fornecedorId: preview.fornecedorEncontrado?.id ?? null,
        fornecedorCnpj: preview.nfe.fornecedor.cnpj,
        fornecedorNome: preview.fornecedorEncontrado?.nome ?? preview.nfe.fornecedor.nome,
        vencimento: vencimento || null,
        itens,
      });
      if (!r.ok) { setErro(r.erro); return; }
      setSucesso(`Compra criada a partir da NF-e! Total ${brl(r.total)}. Estoque e conta a pagar atualizados.`);
      router.refresh();
    });
  }

  const input = "rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-azul";

  return (
    <>
      <button onClick={() => setAberto(true)} className="rounded-lg border border-azul px-4 py-2 text-sm font-semibold text-azul transition hover:bg-azul/10">
        📄 Importar XML de NF-e
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setAberto(false); reset(); }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="chap-stripe" />
            <div className="space-y-3 p-5">
              <h2 className="font-extrabold text-marino">Importar XML de NF-e (entrada)</h2>
              <p className="text-xs text-muted">
                Leitura do arquivo que você já tem — sem certificado digital, sem SEFAZ. Confira tudo antes de confirmar.
              </p>

              {!preview && (
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xml,text/xml"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onArquivo(f); }}
                  className="block w-full text-sm text-marino file:mr-2 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-marino"
                />
              )}

              {pending && !preview && <p className="text-sm text-muted">Lendo XML…</p>}
              {erro && <p className="rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
              {sucesso && <p className="rounded-lg bg-verde/15 px-3 py-2 text-sm font-semibold text-verde">{sucesso}</p>}

              {preview && !sucesso && (
                <>
                  <div className="rounded-lg bg-black/[0.03] p-2 text-sm">
                    <div><strong>NF-e nº</strong> {preview.nfe.numero}/{preview.nfe.serie} — {preview.nfe.dataEmissao ?? "—"}</div>
                    <div>
                      <strong>Fornecedor:</strong> {preview.fornecedorEncontrado?.nome ?? preview.nfe.fornecedor.nome}
                      {!preview.fornecedorEncontrado && <span className="ml-1 rounded bg-amarillo px-1.5 py-0.5 text-[10px] font-bold text-marino">será criado</span>}
                      {" "}({preview.nfe.fornecedor.cnpj || "sem CNPJ"})
                    </div>
                    <div><strong>Total da nota:</strong> {brl(preview.nfe.valorTotal)}</div>
                  </div>

                  <label className="block text-xs text-muted">Vencimento da conta a pagar
                    <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className={input + " mt-0.5"} />
                  </label>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-marino">Itens — confira o vínculo com o estoque</h3>
                    {preview.itens.map((it, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2 text-sm">
                        <div className="min-w-[160px] flex-1">
                          <div className="font-medium text-marino">{it.nome}</div>
                          <div className="text-xs text-muted">{it.quantidade} {it.unidade} × {brl(it.valorUnitario)} = {brl(it.valorTotal)}</div>
                        </div>
                        <select
                          value={mapeamento[i] ?? ""}
                          onChange={(e) => setMapeamento((m) => ({ ...m, [i]: e.target.value }))}
                          className={input}
                        >
                          <option value="">➕ Criar novo item &quot;{it.nome}&quot;</option>
                          {itensEstoque.map((e) => (
                            <option key={e.id} value={e.id}>{e.nome}</option>
                          ))}
                        </select>
                        {!mapeamento[i] && (
                          <span className="rounded bg-amarillo px-1.5 py-0.5 text-[10px] font-bold text-marino">novo item</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setAberto(false); reset(); }} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-marino">Cancelar</button>
                    <button onClick={confirmar} disabled={pending} className="flex-[2] rounded-lg bg-verde py-2 text-sm font-bold text-white disabled:opacity-50">
                      {pending ? "Confirmando…" : "Confirmar importação (estoque + conta a pagar)"}
                    </button>
                  </div>
                </>
              )}

              {sucesso && (
                <button onClick={() => { setAberto(false); reset(); }} className="w-full rounded-lg bg-marino py-2 text-sm font-semibold text-white">Fechar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
