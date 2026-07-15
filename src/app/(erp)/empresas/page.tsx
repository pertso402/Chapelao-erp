import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listarEmpresas } from "@/lib/b2b/queries";
import { PageHeader } from "@/components/PageHeader";
import { EmpresaFormButton } from "@/components/b2b/EmpresaFormButton";

export const dynamic = "force-dynamic";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function EmpresasPage() {
  await requirePermission("b2b.manage");
  const empresas = await listarEmpresas();

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader
          title="Empresas (B2B)"
          subtitle="Faturamento corporativo: empresas, funcionários e regras comerciais."
        />
        <EmpresaFormButton />
      </div>

      {empresas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted">
          Nenhuma empresa cadastrada. Clique em “Nova empresa”.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {empresas.map((c) => (
            <Link
              key={c.id}
              href={`/empresas/${c.id}`}
              className="rounded-2xl border border-border bg-card p-4 transition hover:border-azul"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-marino">{c.nome_fantasia || c.razao_social}</h3>
                {!c.ativo && (
                  <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold text-muted">INATIVA</span>
                )}
              </div>
              <p className="text-xs text-muted">{c.cnpj || "sem CNPJ"}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-marino">
                <span>👥 {c.funcionarios} func.</span>
                {c.percentual_desconto > 0 && <span>🏷️ {c.percentual_desconto}%</span>}
                <span className="ml-auto text-muted">limite {brl(c.limite_credito)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
