// Status de pedido — canônico e COMPATÍVEL com o painel de pedidos (Vercel).
// O painel normaliza status por regex; espelhamos a mesma lógica para que
// ERP e painel classifiquem os pedidos nas mesmas abas.

export type StatusCanonico =
  | "pendente"
  | "preparando"
  | "pronto"
  | "entregue"
  | "cancelado";

export const ABAS_STATUS: StatusCanonico[] = [
  "pendente",
  "preparando",
  "pronto",
  "entregue",
  "cancelado",
];

// Normaliza QUALQUER valor de status do banco para uma aba (igual ao painel).
// Ordem importa: 'aguardando_preparo' contém "preparo" mas é um pedido novo.
export function normalizarStatus(s: string | null | undefined): StatusCanonico {
  const t = String(s ?? "").toLowerCase();
  if (/cancel/.test(t)) return "cancelado";
  if (/entreg/.test(t)) return "entregue";
  if (/pronto|saiu/.test(t)) return "pronto";
  if (/aguard|pend|confirm/.test(t)) return "pendente";
  return "preparando";
}

export const LABEL_STATUS: Record<StatusCanonico, string> = {
  pendente: "Novos",
  preparando: "Preparando",
  pronto: "Prontos",
  entregue: "Finalizados",
  cancelado: "Cancelados",
};

// Cor da identidade Chapelão por aba.
export const COR_STATUS: Record<StatusCanonico, string> = {
  pendente: "var(--chap-azul)",
  preparando: "var(--chap-amarillo)",
  pronto: "var(--chap-verde)",
  entregue: "var(--chap-marino)",
  cancelado: "var(--chap-rojo)",
};

// Próximas ações a partir do status atual (valores GRAVADOS iguais aos do painel).
export function proximosStatus(atual: string | null | undefined): { valor: string; label: string }[] {
  const n = normalizarStatus(atual);
  switch (n) {
    case "pendente":
      return [
        { valor: "preparando", label: "Confirmar / Preparar" },
        { valor: "cancelado", label: "Cancelar" },
      ];
    case "preparando":
      return [
        { valor: "pronto", label: "Marcar Pronto" },
        { valor: "cancelado", label: "Cancelar" },
      ];
    case "pronto":
      return [
        { valor: "saiu_entrega", label: "Saiu para entrega" },
        { valor: "entregue", label: "Finalizar" },
      ];
    default:
      return [];
  }
}

export const CANAIS = ["whatsapp", "telefone", "balcao"] as const;
export type Canal = (typeof CANAIS)[number];
export const LABEL_CANAL: Record<string, string> = {
  whatsapp: "WhatsApp",
  telefone: "Telefone",
  balcao: "Balcão",
};
