"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CaixaAberto } from "@/lib/cash/queries";
import { abrirCaixa, registrarMovimentoCaixa, fecharCaixa } from "@/lib/cash/actions";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function CaixaClient({ caixa }: { caixa: CaixaAberto | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!caixa) return <AbrirCaixa onDone={() => router.refresh()} pending={pending} start={startTransition} />;
  return <CaixaAbertoView caixa={caixa} onDone={() => router.refresh()} pending={pending} start={startTransition} />;
}

function AbrirCaixa({ onDone, pending, start }: { onDone: () => void; pending: boolean; start: React.TransitionStartFunction }) {
  const [saldo, setSaldo] = useState("0");
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="max-w-sm rounded-2xl border border-border bg-card p-6">
      <h2 className="font-extrabold text-marino">Abrir caixa do dia</h2>
      <p className="mt-1 text-sm text-muted">Informe o troco/fundo inicial em dinheiro.</p>
      <label className="mt-3 block text-xs text-muted">Saldo inicial (R$)
        <input type="number" value={saldo} onChange={(e) => setSaldo(e.target.value)} className="mt-0.5 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul" />
      </label>
      {erro && <p className="mt-2 rounded-lg bg-rojo/10 px-3 py-2 text-sm text-rojo">{erro}</p>}
      <button
        onClick={() => start(async () => { const r = await abrirCaixa(Number(saldo)); if (!r.ok) return setErro(r.erro); onDone(); })}
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-verde py-2.5 font-bold text-white transition hover:brightness-95 disabled:opacity-50"
      >
        {pending ? "Abrindo…" : "Abrir caixa"}
      </button>
    </div>
  );
}

function CaixaAbertoView({ caixa, onDone, pending, start }: { caixa: CaixaAberto; onDone: () => void; pending: boolean; start: React.TransitionStartFunction }) {
  const [contDin, setContDin] = useState("");
  const [contPix, setContPix] = useState("");
  const [contCar, setContCar] = useState("");
  const [movTipo, setMovTipo] = useState<"sangria" | "suprimento" | "despesa">("sangria");
  const [movValor, setMovValor] = useState("");
  const [movMotivo, setMovMotivo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const dif = (c: string, esperado: number) => (c === "" ? null : Number(c) - esperado);
  const difDin = dif(contDin, caixa.esperado.dinheiro);
  const difPix = dif(contPix, caixa.esperado.pix);
  const difCar = dif(contCar, caixa.esperado.cartao);

  function movimento() {
    setMsg(null);
    start(async () => {
      const r = await registrarMovimentoCaixa({ session_id: caixa.id, tipo: movTipo, valor: Number(movValor), motivo: movMotivo });
      if (!r.ok) return setMsg(r.erro);
      setMovValor(""); setMovMotivo(""); onDone();
    });
  }
  function fechar() {
    setMsg(null);
    start(async () => {
      const r = await fecharCaixa({ contado_dinheiro: Number(contDin) || 0, contado_pix: Number(contPix) || 0, contado_cartao: Number(contCar) || 0 });
      if (!r.ok) return setMsg(r.erro);
      onDone();
    });
  }

  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-azul";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-marino">Caixa aberto</h2>
            <span className="text-xs text-muted">desde {hora(caixa.aberta_em)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Info label="Saldo inicial" valor={brl(caixa.saldo_inicial)} />
            <Info label="Vendas dinheiro" valor={brl(caixa.vendas.dinheiro)} />
            <Info label="Vendas PIX" valor={brl(caixa.vendas.pix)} />
            <Info label="Vendas cartão" valor={brl(caixa.vendas.cartao)} />
            <Info label="Suprimentos" valor={brl(caixa.suprimentos)} />
            <Info label="Sangrias" valor={brl(caixa.sangrias)} />
            <Info label="Despesas caixa" valor={brl(caixa.despesas)} />
          </div>
        </div>

        {/* Esperado × contado */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 font-bold text-marino">Fechamento por forma de pagamento</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-1">Forma</th>
                <th className="pb-1 text-right">Esperado</th>
                <th className="pb-1 text-right">Contado</th>
                <th className="pb-1 text-right">Diferença</th>
              </tr>
            </thead>
            <tbody>
              <LinhaFechamento nome="Dinheiro" esperado={caixa.esperado.dinheiro} contado={contDin} setContado={setContDin} dif={difDin} />
              <LinhaFechamento nome="PIX" esperado={caixa.esperado.pix} contado={contPix} setContado={setContPix} dif={difPix} />
              <LinhaFechamento nome="Cartão" esperado={caixa.esperado.cartao} contado={contCar} setContado={setContCar} dif={difCar} />
            </tbody>
          </table>
          {msg && <p className="mt-3 rounded-lg bg-amarillo/20 px-3 py-2 text-sm text-marino">{msg}</p>}
          <button onClick={fechar} disabled={pending} className="mt-4 rounded-lg bg-rojo px-5 py-2.5 font-bold text-white transition hover:brightness-95 disabled:opacity-50">
            {pending ? "Fechando…" : "Fechar caixa"}
          </button>
        </div>
      </div>

      {/* Sangria / suprimento / despesa */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 font-bold text-marino">Movimento de caixa</h2>
          <div className="mb-2 flex gap-1">
            {(["sangria", "suprimento", "despesa"] as const).map((t) => (
              <button key={t} onClick={() => setMovTipo(t)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition ${movTipo === t ? "bg-marino text-white" : "border border-border text-marino"}`}>{t}</button>
            ))}
          </div>
          <input type="number" value={movValor} onChange={(e) => setMovValor(e.target.value)} placeholder="Valor (R$)" className={input + " mb-2"} />
          <input value={movMotivo} onChange={(e) => setMovMotivo(e.target.value)} placeholder="Justificativa" className={input} />
          <button onClick={movimento} disabled={pending} className="mt-2 w-full rounded-lg bg-marino py-2 text-sm font-semibold text-white disabled:opacity-50">Registrar</button>
        </div>

        {caixa.movimentos.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-bold text-marino">Movimentos</h3>
            <div className="divide-y divide-border text-sm">
              {caixa.movimentos.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1.5">
                  <span className="capitalize text-marino">{m.tipo} <span className="text-xs text-muted">{m.motivo}</span></span>
                  <span className="font-semibold text-marino">{brl(m.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return <div><div className="text-xs text-muted">{label}</div><div className="font-bold text-marino">{valor}</div></div>;
}

function LinhaFechamento({ nome, esperado, contado, setContado, dif }: { nome: string; esperado: number; contado: string; setContado: (v: string) => void; dif: number | null }) {
  return (
    <tr className="border-t border-border">
      <td className="py-2 font-medium text-marino">{nome}</td>
      <td className="py-2 text-right text-muted">{brl(esperado)}</td>
      <td className="py-2 text-right">
        <input type="number" value={contado} onChange={(e) => setContado(e.target.value)} placeholder="—" className="w-24 rounded-lg border border-border px-2 py-1 text-right outline-none focus:border-azul" />
      </td>
      <td className={`py-2 text-right font-semibold ${dif === null ? "text-muted" : dif === 0 ? "text-verde" : dif < 0 ? "text-rojo" : "text-azul"}`}>
        {dif === null ? "—" : dif.toLocaleString("pt-BR", { style: "currency", currency: "BRL", signDisplay: "exceptZero" })}
      </td>
    </tr>
  );
}
