import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.generated";

export type Empresa = Tables<"companies">;
export type Funcionario = Tables<"company_employees">;

export async function listarEmpresas(): Promise<(Empresa & { funcionarios: number })[]> {
  const supabase = await createClient();
  const { data: empresas } = await supabase
    .from("companies")
    .select("*")
    .order("razao_social");
  const { data: emps } = await supabase.from("company_employees").select("company_id");

  const contagem = new Map<string, number>();
  for (const e of emps ?? []) contagem.set(e.company_id, (contagem.get(e.company_id) ?? 0) + 1);

  return (empresas ?? []).map((c) => ({ ...c, funcionarios: contagem.get(c.id) ?? 0 }));
}

export type EmpresaPdv = {
  id: string;
  nome: string;
  percentual_desconto: number;
  funcionarios: { id: string; nome: string }[];
};

// Empresas ativas + funcionários, para atribuição de pedido corporativo no PDV.
export async function listarEmpresasParaPdv(): Promise<EmpresaPdv[]> {
  const supabase = await createClient();
  const [{ data: empresas }, { data: funcs }] = await Promise.all([
    supabase.from("companies").select("id, nome_fantasia, razao_social, percentual_desconto").eq("ativo", true).order("razao_social"),
    supabase.from("company_employees").select("id, company_id, nome").eq("ativo", true).order("nome"),
  ]);
  const porEmpresa = new Map<string, { id: string; nome: string }[]>();
  for (const f of funcs ?? []) {
    const arr = porEmpresa.get(f.company_id) ?? [];
    arr.push({ id: f.id, nome: f.nome });
    porEmpresa.set(f.company_id, arr);
  }
  return (empresas ?? []).map((c) => ({
    id: c.id,
    nome: c.nome_fantasia || c.razao_social,
    percentual_desconto: Number(c.percentual_desconto),
    funcionarios: porEmpresa.get(c.id) ?? [],
  }));
}

export async function getEmpresa(id: string): Promise<Empresa | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listarFuncionarios(companyId: string): Promise<Funcionario[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_employees")
    .select("*")
    .eq("company_id", companyId)
    .order("nome");
  return data ?? [];
}

export type ConsumoFuncionario = {
  employee_id: string | null;
  nome: string;
  pedidos: number;
  total: number;
};

// Consumo do mês corrente por funcionário (pedidos não cancelados).
export async function consumoDoMes(companyId: string): Promise<{
  itens: ConsumoFuncionario[];
  total: number;
}> {
  const supabase = await createClient();
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [{ data: pedidos }, { data: funcs }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("total, status, company_employee_id")
      .eq("company_id", companyId)
      .gte("created_at", inicioMes.toISOString()),
    supabase.from("company_employees").select("id, nome").eq("company_id", companyId),
  ]);

  const nomePorId = new Map((funcs ?? []).map((f) => [f.id, f.nome]));
  const acc = new Map<string, ConsumoFuncionario>();
  let total = 0;

  for (const p of pedidos ?? []) {
    if (p.status && /cancel/i.test(p.status)) continue;
    const key = p.company_employee_id ?? "__sem__";
    const nome = p.company_employee_id ? nomePorId.get(p.company_employee_id) ?? "—" : "Sem funcionário";
    const cur = acc.get(key) ?? { employee_id: p.company_employee_id, nome, pedidos: 0, total: 0 };
    cur.pedidos += 1;
    cur.total += Number(p.total ?? 0);
    acc.set(key, cur);
    total += Number(p.total ?? 0);
  }

  return { itens: [...acc.values()].sort((a, b) => b.total - a.total), total };
}
