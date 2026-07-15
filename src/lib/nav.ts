// Configuração central da navegação do ERP.
// Cada item declara a permissão necessária. O layout filtra pelo que o usuário tem.
// `demo: true` marca módulos ainda não implementados (mostrados com dados de demonstração).

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  permission: string;
  demo?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",       icon: "📊", permission: "dashboard.view" },
  { href: "/pedidos",      label: "Pedidos",         icon: "🧾", permission: "orders.view" },
  { href: "/pdv",          label: "PDV / Balcão",    icon: "🛒", permission: "pdv.use" },
  { href: "/cozinha",      label: "Cozinha",         icon: "🍲", permission: "kitchen.view" },
  { href: "/clientes",     label: "Clientes",        icon: "👥", permission: "customers.manage" },
  { href: "/cardapio",     label: "Cardápio",        icon: "📋", permission: "catalog.manage" },
  { href: "/empresas",     label: "Empresas (B2B)",  icon: "🏢", permission: "b2b.manage" },
  { href: "/estoque",      label: "Estoque",         icon: "📦", permission: "inventory.manage" },
  { href: "/compras",      label: "Compras",         icon: "🚚", permission: "purchasing.manage", demo: true },
  { href: "/financeiro",   label: "Financeiro",      icon: "💰", permission: "finance.view" },
  { href: "/relatorios",   label: "Relatórios",      icon: "📈", permission: "reports.view", demo: true },
  { href: "/configuracoes",label: "Configurações",   icon: "⚙️", permission: "settings.manage", demo: true },
];

export function visibleNavItems(permissions: string[]): NavItem[] {
  const set = new Set(permissions);
  return NAV_ITEMS.filter((item) => set.has(item.permission));
}
