import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { visibleNavItems } from "@/lib/nav";
import type { Tables } from "@/types/database.generated";

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Tables<"profiles"> | null;
  roles: string[];        // slugs: atendente | proprietario | administrador
  permissions: string[];  // slugs de permissão
};

// Carrega o usuário atual com perfil, papéis e permissões efetivas.
// Envolto em cache() do React: chamado uma vez por requisição, mesmo que
// layout + guarda de página peçam o usuário separadamente.
//
// Usa getSession() (lê o cookie local, sem round-trip de rede) em vez de
// getUser() (revalida contra o servidor de Auth): o middleware (updateSession)
// já chamou getUser() para ESTA MESMA requisição e barrou/redirecionou sessão
// inválida antes de chegar aqui — repetir a validação de rede só duplica
// latência em toda navegação sem ganho de segurança real, já que a RLS do
// Postgres valida a assinatura do JWT de qualquer forma em cada query.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_roles")
      .select("roles(slug, role_permissions(permissions(slug)))")
      .eq("user_id", user.id),
  ]);

  const roles = new Set<string>();
  const permissions = new Set<string>();

  type RoleRow = {
    roles: {
      slug: string;
      role_permissions: { permissions: { slug: string } | null }[] | null;
    } | null;
  };

  for (const row of (roleRows ?? []) as unknown as RoleRow[]) {
    const r = row.roles;
    if (!r) continue;
    roles.add(r.slug);
    for (const rp of r.role_permissions ?? []) {
      if (rp.permissions?.slug) permissions.add(rp.permissions.slug);
    }
  }

  return {
    id: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
    roles: [...roles],
    permissions: [...permissions],
  };
});

export function hasPermission(user: CurrentUser | null, perm: string): boolean {
  return !!user?.permissions.includes(perm);
}

// Primeira rota que o usuário tem permissão de acessar (para landing pós-login).
export function firstAllowedRoute(user: CurrentUser): string {
  const items = visibleNavItems(user.permissions);
  return items[0]?.href ?? "/sem-acesso";
}

// Exige uma permissão numa página do servidor; redireciona se faltar.
export async function requirePermission(perm: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, perm)) redirect(firstAllowedRoute(user));
  return user;
}
