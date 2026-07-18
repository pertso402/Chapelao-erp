import { createClient } from "@/lib/supabase/server";

export type PedidoLista = {
  id: string;
  numero_pedido: number;
  status: string | null;
  canal: string;
  tipo_entrega: string | null;
  endereco_entrega: string | null;
  forma_pagamento: string | null;
  troco_para: number | null;
  subtotal: number | null;
  taxa_entrega: number | null;
  desconto: number | null;
  total: number | null;
  observacao: string | null;
  created_at: string | null;
  cliente: { nome: string | null; telefone: string | null } | null;
  itens: { nome_produto: string; quantidade: number; preco_unitario: number; total: number }[];
};

// Lista operacional de pedidos (últimos 60 dias), com cliente e itens.
// Espelha a janela do painel para consistência.
export async function listarPedidos(): Promise<PedidoLista[]> {
  const supabase = await createClient();
  const desde = new Date(Date.now() - 60 * 864e5).toISOString();

  const { data, error } = await supabase
    .from("pedidos")
    .select(
      `id, numero_pedido, status, canal, tipo_entrega, endereco_entrega, forma_pagamento,
       troco_para, subtotal, taxa_entrega, desconto, total, observacao, created_at,
       clientes ( nome, telefone ),
       itens_pedido ( nome_produto, quantidade, preco_unitario, total )`,
    )
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) throw new Error(error.message);

  type Row = {
    id: string; numero_pedido: number; status: string | null; canal: string;
    tipo_entrega: string | null; endereco_entrega: string | null;
    forma_pagamento: string | null; troco_para: number | null;
    subtotal: number | null; taxa_entrega: number | null; desconto: number | null;
    total: number | null; observacao: string | null;
    created_at: string | null;
    clientes: { nome: string | null; telefone: string | null } | null;
    itens_pedido: { nome_produto: string; quantidade: number; preco_unitario: number; total: number }[] | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    numero_pedido: r.numero_pedido,
    status: r.status,
    canal: r.canal,
    tipo_entrega: r.tipo_entrega,
    endereco_entrega: r.endereco_entrega,
    forma_pagamento: r.forma_pagamento,
    troco_para: r.troco_para,
    subtotal: r.subtotal,
    taxa_entrega: r.taxa_entrega,
    desconto: r.desconto,
    total: r.total,
    observacao: r.observacao,
    created_at: r.created_at,
    cliente: r.clientes,
    itens: r.itens_pedido ?? [],
  }));
}
