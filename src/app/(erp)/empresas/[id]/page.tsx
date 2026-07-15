import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getEmpresa, listarFuncionarios, consumoDoMes } from "@/lib/b2b/queries";
import { EmpresaFormButton } from "@/components/b2b/EmpresaFormButton";
import { FuncionarioFormButton } from "@/components/b2b/FuncionarioFormButton";

export const dynamic = "force-dynamic";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function EmpresaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("b2b.manage");
  const { id } = await params;
  const empresa = await getEmpresa(id);
  if (!empresa) notFound();

  const [funcionarios, consumo] = await Promise.all([
    listarFuncionarios(id),
    consumoDoMes(id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/empresas" className="text-sm text-azul hover:underline">← Empresas</Link>
        <div className="mt-1 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-marino">{empresa.nome_fantasia || empresa.razao_social}</h1>
            <p className="text-sm text-muted">{empresa.razao_social} · {empresa.cnpj || "sem CNPJ"}</p>
          </div>
          <EmpresaFormButton empresa={empresa} />
        </div>
      </div>

      {/* Regras comerciais */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Desconto" valor={`${empresa.percentual_desconto}%`} />
        <Card label="Limite de crédito" valor={brl(empresa.limite_credito)} />
        <Card label="Dia de fechamento" valor={empresa.dia_fechamento ? `dia ${empresa.dia_fechamento}` : "—"} />
        <Card label="Dia de vencimento" valor={empresa.dia_vencimento ? `dia ${empresa.dia_vencimento}` : "—"} />
      </section>

      {/* Consumo do mês */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-marino">Consumo do mês</h2>
          <span className="text-lg font-extrabold text-verde">{brl(consumo.total)}</span>
        </div>
        {consumo.itens.length === 0 ? (
          <p className="text-sm text-muted">Nenhum consumo registrado neste mês.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-1">Funcionário</th>
                <th className="pb-1 text-right">Pedidos</th>
                <th className="pb-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {consumo.itens.map((c) => (
                <tr key={c.employee_id ?? "sem"} className="border-t border-border">
                  <td className="py-1.5 text-marino">{c.nome}</td>
                  <td className="py-1.5 text-right">{c.pedidos}</td>
                  <td className="py-1.5 text-right font-semibold text-marino">{brl(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Funcionários */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-marino">Funcionários ({funcionarios.length})</h2>
          <FuncionarioFormButton companyId={id} />
        </div>
        {funcionarios.length === 0 ? (
          <p className="text-sm text-muted">Nenhum funcionário cadastrado.</p>
        ) : (
          <div className="divide-y divide-border">
            {funcionarios.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-semibold text-marino">{f.nome}</span>
                  <span className="ml-2 text-xs text-muted">
                    {[f.setor, f.matricula].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    limite {f.limite_mensal > 0 ? brl(f.limite_mensal) + "/mês" : "livre"}
                  </span>
                  <FuncionarioFormButton companyId={id} funcionario={f} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-extrabold text-marino">{valor}</div>
    </div>
  );
}
