import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { visibleNavItems } from "@/lib/nav";
import { Sidebar } from "@/components/Sidebar";
import { LogoutButton } from "@/components/LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  atendente: "Atendente / Caixa",
  proprietario: "Proprietário",
  administrador: "Administrador",
};

export default async function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = visibleNavItems(user.permissions);
  const papelPrincipal = user.roles[0] ? ROLE_LABEL[user.roles[0]] ?? user.roles[0] : "Sem papel";
  const nome = user.profile?.nome ?? user.email ?? "Usuário";

  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
          <div className="text-sm text-muted md:hidden font-bold text-rojo">🎩 Chapelão</div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold text-marino">{nome}</div>
              <div className="text-xs text-muted">{papelPrincipal}</div>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
