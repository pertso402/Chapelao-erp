import { requirePermission } from "@/lib/auth/session";
import { listarCupons, listarOfertas, listarIndicacoes, resumoClientes } from "@/lib/crm/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { NovoCupomButton } from "@/components/crm/NovoCupomButton";
import { CupomUsadoToggle } from "@/components/crm/CupomUsadoToggle";

export const dynamic = "force-dynamic";

const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

export default async function MarketingPage() {
  await requirePermission("marketing.manage");
  const supabase = await createClient();

  const [cupons, ofertas, indicacoes, resumo, { data: clientesRaw }] = await Promise.all([
    listarCupons(),
    listarOfertas(),
    listarIndicacoes(),
    resumoClientes(),
    supabase.from("clientes").select("id, nome, telefone").order("nome"),
  ]);

  const clientes = (clientesRaw ?? []).map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone }));
  const conversoes = ofertas.filter((o) => o.converteu === true).length;
  const taxaConversao = ofertas.length > 0 ? (conversoes / ofertas.length) * 100 : 0;

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Cupons, ofertas do agente e indicações — os dados de CRM que já existiam, agora com painel." />

      {/* Resumo de clientes */}
      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card label="Clientes" valor={String(resumo.total)} cor="var(--chap-marino)" />
        <Card label="Ativos (≤15d)" valor={String(resumo.ativos)} cor="var(--chap-verde)" />
        <Card label="Em risco (16-30d)" valor={String(resumo.emRisco)} cor="var(--chap-amarillo)" />
        <Card label="Inativos (30d+)" valor={String(resumo.inativos)} cor="var(--chap-rojo)" />
        <Card label="Nunca compraram" valor={String(resumo.semPedido)} cor="var(--chap-azul)" />
      </section>

      {/* Cupons */}
      <section className="mb-5 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-marino">Cupons</h2>
          <NovoCupomButton clientes={clientes} />
        </div>
        {cupons.length === 0 ? (
          <p className="text-sm text-muted">Nenhum cupom.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-1">Código</th>
                  <th className="pb-1">Cliente</th>
                  <th className="pb-1">Tipo</th>
                  <th className="pb-1 text-right">Desconto</th>
                  <th className="pb-1">Válido até</th>
                  <th className="pb-1"></th>
                </tr>
              </thead>
              <tbody>
                {cupons.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-1.5 font-mono font-semibold text-marino">{c.codigo}</td>
                    <td className="py-1.5 text-marino">{c.clienteNome ?? "—"}</td>
                    <td className="py-1.5 text-muted">{c.tipo === "brinde" ? "Brinde" : "Desconto"}</td>
                    <td className="py-1.5 text-right text-marino">{c.tipo === "brinde" ? "—" : `${c.descontoPercentual}%`}</td>
                    <td className="py-1.5 text-muted">{dt(c.validoAte)}</td>
                    <td className="py-1.5 text-right"><CupomUsadoToggle id={c.id} usado={c.usado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ofertas de reativação */}
      <section className="mb-5 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-marino">Ofertas de reativação (agente)</h2>
          <span className="text-sm font-bold text-marino">
            {conversoes}/{ofertas.length} conversões <span className="text-verde">({taxaConversao.toFixed(0)}%)</span>
          </span>
        </div>
        {ofertas.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma oferta enviada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-1">Cliente</th>
                  <th className="pb-1">Tipo</th>
                  <th className="pb-1 text-right">Dias sem comprar</th>
                  <th className="pb-1">Enviado em</th>
                  <th className="pb-1">Cupom</th>
                  <th className="pb-1">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {ofertas.slice(0, 50).map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="py-1.5 text-marino">{o.clienteNome ?? "—"}</td>
                    <td className="py-1.5 text-muted">{o.tipoOferta}</td>
                    <td className="py-1.5 text-right text-marino">{o.diasSemComprar}</td>
                    <td className="py-1.5 text-muted">{dt(o.enviadoEm)}</td>
                    <td className="py-1.5 font-mono text-marino">{o.cupomCodigo ?? "—"}</td>
                    <td className="py-1.5">
                      {o.converteu === true ? (
                        <span className="rounded-full bg-verde/15 px-2 py-0.5 text-[10px] font-bold text-verde">converteu</span>
                      ) : o.converteu === false ? (
                        <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold text-muted">sem retorno</span>
                      ) : (
                        <span className="rounded-full bg-amarillo/60 px-2 py-0.5 text-[10px] font-bold text-marino">pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Indicações */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-bold text-marino">Programa de indicações</h2>
        {indicacoes.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma indicação registrada ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-1">Indicado por</th>
                <th className="pb-1">Nome indicado</th>
                <th className="pb-1">Status</th>
                <th className="pb-1">Convertido em</th>
              </tr>
            </thead>
            <tbody>
              {indicacoes.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="py-1.5 text-marino">{i.indicadoPor ?? "—"}</td>
                  <td className="py-1.5 text-marino">{i.nomeIndicado}</td>
                  <td className="py-1.5 text-muted">{i.status}</td>
                  <td className="py-1.5 text-muted">{dt(i.convertidoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Card({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-extrabold" style={{ color: cor }}>{valor}</div>
    </div>
  );
}
