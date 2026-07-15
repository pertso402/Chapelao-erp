import { requirePermission } from "@/lib/auth/session";
import { listarCardapioComOpcoes } from "@/lib/catalog/queries";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function regraGrupo(min: number, max: number | null): string {
  if (min === 1 && max === 1) return "escolha 1";
  if (max === null && min === 0) return "opcionais";
  if (max === null) return `mínimo ${min}`;
  if (min === max) return `escolha ${min}`;
  return `${min} a ${max}`;
}

export default async function CardapioPage() {
  await requirePermission("catalog.manage");
  const produtos = await listarCardapioComOpcoes();

  const porCategoria: Record<string, typeof produtos> = {};
  for (const p of produtos) (porCategoria[p.categoria || "Outros"] ||= []).push(p);

  return (
    <div>
      <PageHeader
        title="Cardápio"
        subtitle="Produtos e a composição das marmitas (mistura, acompanhamentos e adicionais)."
      />

      <div className="space-y-6">
        {Object.entries(porCategoria).map(([cat, itens]) => (
          <section key={cat}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-rojo">{cat}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {itens.map((p) => (
                <article key={p.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-bold text-marino">{p.nome}</h3>
                    <span className="font-extrabold text-verde">{brl(p.preco)}</span>
                  </div>

                  {p.grupos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {p.grupos.map((g) => (
                        <div key={g.id} className="rounded-lg bg-black/[0.03] p-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-marino">{g.nome}</span>
                            <span className="rounded-full bg-amarillo px-2 py-0.5 text-[10px] font-bold text-marino">
                              {regraGrupo(g.min_escolhas, g.max_escolhas)}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {g.opcoes.map((o) => (
                              <span
                                key={o.id}
                                className="rounded border border-border bg-white px-1.5 py-0.5 text-[11px] text-marino"
                              >
                                {o.nome}
                                {o.preco_adicional > 0 && (
                                  <span className="text-verde"> +{brl(o.preco_adicional)}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
