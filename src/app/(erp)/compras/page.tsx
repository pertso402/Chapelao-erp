import { requirePermission } from "@/lib/auth/session";
import { listarFornecedores, listarCompras } from "@/lib/purchasing/queries";
import { listarEstoque } from "@/lib/inventory/queries";
import { PageHeader } from "@/components/PageHeader";
import { NovaCompraForm } from "@/components/purchasing/NovaCompraForm";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export default async function ComprasPage() {
  await requirePermission("purchasing.manage");
  const [fornecedores, compras, estoque] = await Promise.all([
    listarFornecedores(),
    listarCompras(),
    listarEstoque(),
  ]);
  const itensInv = estoque.map((i) => ({ id: i.id, nome: i.nome, sigla: i.sigla, custo: i.custo_atual }));

  return (
    <div>
      <PageHeader title="Compras" subtitle="Registre uma compra: ela entra no estoque e gera a conta a pagar." />

      <div className="mb-5">
        <NovaCompraForm fornecedores={fornecedores.map((f) => ({ id: f.id, nome: f.nome }))} itens={itensInv} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 font-bold text-marino">Compras recentes</h2>
          {compras.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma compra registrada.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-1">Data</th>
                  <th className="pb-1">Fornecedor</th>
                  <th className="pb-1 text-right">Itens</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-1.5 text-muted">{dt(c.created_at)}</td>
                    <td className="py-1.5 text-marino">{c.fornecedor}</td>
                    <td className="py-1.5 text-right">{c.itens}</td>
                    <td className="py-1.5 text-right font-semibold text-marino">{brl(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 font-bold text-marino">Fornecedores</h2>
          <div className="divide-y divide-border">
            {fornecedores.map((f) => (
              <div key={f.id} className="py-2 text-sm">
                <div className="font-medium text-marino">{f.nome}</div>
                <div className="text-xs text-muted">{f.cnpj} · {f.contato}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
