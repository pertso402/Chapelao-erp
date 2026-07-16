import { requirePermission } from "@/lib/auth/session";
import { getCaixaAberto, ultimosFechamentos } from "@/lib/cash/queries";
import { PageHeader } from "@/components/PageHeader";
import { CaixaClient } from "@/components/cash/CaixaClient";

export const dynamic = "force-dynamic";

const brl = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

type Fechamento = { diferenca?: { dinheiro?: number; pix?: number; cartao?: number } };

export default async function CaixaPage() {
  await requirePermission("pdv.use");
  const [caixa, fechamentos] = await Promise.all([getCaixaAberto(), ultimosFechamentos()]);

  return (
    <div>
      <PageHeader title="Caixa" subtitle="Abertura, sangrias/suprimentos e fechamento diário por forma de pagamento." />
      <CaixaClient caixa={caixa} />

      {fechamentos.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 font-bold text-marino">Fechamentos recentes</h2>
          <div className="divide-y divide-border text-sm">
            {fechamentos.map((f) => {
              const fc = f.fechamento as Fechamento | null;
              const dif = (fc?.diferenca?.dinheiro ?? 0) + (fc?.diferenca?.pix ?? 0) + (fc?.diferenca?.cartao ?? 0);
              return (
                <div key={f.id} className="flex items-center justify-between py-2">
                  <span className="text-marino">{dia(f.fechada_em)}</span>
                  <span className={`font-semibold ${dif === 0 ? "text-verde" : "text-rojo"}`}>
                    Diferença total: {brl(dif)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
