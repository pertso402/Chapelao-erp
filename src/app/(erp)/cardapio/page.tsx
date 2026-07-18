import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listarCardapioComOpcoes } from "@/lib/catalog/queries";
import { custoPorProduto } from "@/lib/recipes/queries";
import { PageHeader } from "@/components/PageHeader";
import { ProdutoFormModal } from "@/components/catalog/ProdutoFormModal";
import { ProdutoDeleteButton } from "@/components/catalog/ProdutoDeleteButton";

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
  const [produtos, custos] = await Promise.all([listarCardapioComOpcoes(true), custoPorProduto()]);

  const porCategoria: Record<string, typeof produtos> = {};
  for (const p of produtos) (porCategoria[p.categoria || "Outros"] ||= []).push(p);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Cardápio"
          subtitle="Produtos e a composição das marmitas (mistura, acompanhamentos e adicionais)."
        />
        <ProdutoFormModal />
      </div>

      <div className="space-y-6">
        {Object.entries(porCategoria).map(([cat, itens]) => (
          <section key={cat}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-rojo">{cat}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {itens.map((p) => (
                <article key={p.id} className={`rounded-2xl border border-border bg-card p-4 ${!p.disponivel ? "opacity-60" : ""}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-bold text-marino">
                      {p.nome}
                      {p.destaque && <span className="ml-1.5 text-xs">⭐</span>}
                      {!p.disponivel && (
                        <span className="ml-1.5 rounded-full bg-marino/10 px-2 py-0.5 text-[10px] font-bold text-marino">indisponível</span>
                      )}
                    </h3>
                    <span className="shrink-0 font-extrabold text-verde">{brl(p.preco)}</span>
                  </div>
                  {p.descricao && <p className="mt-0.5 text-xs text-muted">{p.descricao}</p>}
                  {p.preco_delivery != null && (
                    <p className="mt-0.5 text-xs text-muted">🛵 delivery: <span className="font-semibold text-marino">{brl(p.preco_delivery)}</span></p>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <ProdutoFormModal
                      produto={{
                        id: p.id, nome: p.nome, categoria: p.categoria, descricao: p.descricao,
                        preco_base: p.preco_base, preco_promocional: p.preco_promocional,
                        preco_delivery: p.preco_delivery,
                        disponivel: p.disponivel, destaque: p.destaque,
                      }}
                    />
                    <ProdutoDeleteButton id={p.id} disponivel={p.disponivel} />
                  </div>

                  {(() => {
                    const custo = custos.get(p.id);
                    const temFicha = custo != null;
                    const margem = temFicha ? p.preco - custo! : 0;
                    const margemPct = temFicha && p.preco > 0 ? (margem / p.preco) * 100 : 0;
                    return (
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        {temFicha ? (
                          <span className="text-muted">
                            custo {brl(custo!)} · margem <span className="font-bold text-verde">{margemPct.toFixed(0)}%</span>
                          </span>
                        ) : (
                          <span className="text-muted">sem ficha técnica</span>
                        )}
                        <Link href={`/fichas/${p.id}`} className="ml-auto font-semibold text-azul hover:underline">
                          {temFicha ? "ficha técnica" : "criar ficha"}
                        </Link>
                      </div>
                    );
                  })()}

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
