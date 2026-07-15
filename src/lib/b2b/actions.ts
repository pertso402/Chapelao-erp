"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

export async function salvarEmpresa(input: {
  id?: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  whatsapp?: string;
  responsavel_financeiro?: string;
  percentual_desconto?: number;
  dia_fechamento?: number | null;
  dia_vencimento?: number | null;
  limite_credito?: number;
}) {
  const user = await requirePermission("b2b.manage");
  if (!input.razao_social?.trim()) return { ok: false as const, erro: "Informe a razão social." };
  const supabase = await createClient();

  const payload = {
    razao_social: input.razao_social.trim(),
    nome_fantasia: input.nome_fantasia?.trim() || null,
    cnpj: input.cnpj?.trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
    responsavel_financeiro: input.responsavel_financeiro?.trim() || null,
    percentual_desconto: Number(input.percentual_desconto ?? 0),
    dia_fechamento: input.dia_fechamento ?? null,
    dia_vencimento: input.dia_vencimento ?? null,
    limite_credito: Number(input.limite_credito ?? 0),
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("companies").update(payload).eq("id", input.id);
    if (error) return { ok: false as const, erro: error.message };
    revalidatePath(`/empresas/${input.id}`);
    return { ok: true as const, id: input.id };
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...payload, unit_id: user.profile?.unit_id ?? null })
    .select("id")
    .single();
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/empresas");
  return { ok: true as const, id: data.id };
}

export async function salvarFuncionario(input: {
  id?: string;
  company_id: string;
  nome: string;
  telefone?: string;
  matricula?: string;
  setor?: string;
  limite_mensal?: number;
  limite_diario?: number;
}) {
  await requirePermission("b2b.manage");
  if (!input.nome?.trim()) return { ok: false as const, erro: "Informe o nome do funcionário." };
  const supabase = await createClient();

  const payload = {
    company_id: input.company_id,
    nome: input.nome.trim(),
    telefone: input.telefone?.trim() || null,
    matricula: input.matricula?.trim() || null,
    setor: input.setor?.trim() || null,
    limite_mensal: Number(input.limite_mensal ?? 0),
    limite_diario: Number(input.limite_diario ?? 0),
  };

  if (input.id) {
    const { error } = await supabase.from("company_employees").update(payload).eq("id", input.id);
    if (error) return { ok: false as const, erro: error.message };
  } else {
    const { error } = await supabase.from("company_employees").insert(payload);
    if (error) return { ok: false as const, erro: error.message };
  }
  revalidatePath(`/empresas/${input.company_id}`);
  return { ok: true as const };
}
