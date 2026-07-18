"use server";

import { createClient } from "@/lib/supabase/server";

// Lista de nomes pra tela de login (botões). Não expõe e-mail nem papel.
export async function listarColaboradoresLogin(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listar_colaboradores_login");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.nome).filter((n): n is string => !!n);
}

// Resolve nome -> e-mail (RPC restrita) e autentica normalmente via GoTrue.
export async function entrarComNomeSenha(nome: string, senha: string) {
  const supabase = await createClient();

  const { data: email, error: erroEmail } = await supabase.rpc("email_por_nome_login", { p_nome: nome });
  if (erroEmail || !email) return { ok: false as const, erro: "Colaborador não encontrado." };

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false as const, erro: "Senha incorreta." };

  return { ok: true as const };
}
