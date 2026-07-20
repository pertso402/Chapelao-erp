"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

export type OpcaoEscolhida = { option_id: string; nome: string; preco: number };

export type ItemBalcao = {
  produto_id: string;
  nome: string;
  preco_unitario: number; // já inclui adicionais das opções
  quantidade: number;
  opcoes?: OpcaoEscolhida[];
  composicao?: string; // texto legível para a cozinha (ex.: "Bife · Arroz, Feijão · +Ovo")
};

// Busca um cliente pelo telefone (só dígitos). Retorna nome/endereço se existir.
export async function buscarClientePorTelefone(telefone: string) {
  await requirePermission("pdv.use");
  const tel = String(telefone).replace(/\D/g, "");
  if (tel.length < 8) return { encontrado: false as const };

  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nome, endereco")
    .eq("telefone", tel)
    .maybeSingle();

  if (!data) return { encontrado: false as const };
  return { encontrado: true as const, nome: data.nome, endereco: data.endereco };
}

async function getTaxaEntrega(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number> {
  const { data } = await supabase
    .from("info_restaurante")
    .select("valor")
    .eq("chave", "taxa_entrega")
    .maybeSingle();
  const t = Number(data?.valor);
  return Number.isFinite(t) ? t : 5;
}

export async function criarPedidoBalcao(input: {
  nome: string;
  telefone: string;
  tipo_entrega: "delivery" | "retirada";
  endereco?: string;
  forma_pagamento: string;
  itens: ItemBalcao[];
  company_id?: string | null;
  company_employee_id?: string | null;
  percentual_desconto?: number;
  comanda_id?: string | null;
}) {
  const user = await requirePermission("pdv.use");
  const supabase = await createClient();

  const itens = (input.itens ?? []).filter((i) => i.quantidade > 0);
  if (!itens.length) return { ok: false as const, erro: "Adicione ao menos um item." };
  if (!input.nome?.trim()) return { ok: false as const, erro: "Informe o nome do cliente." };
  if (input.tipo_entrega === "delivery" && !input.endereco?.trim())
    return { ok: false as const, erro: "Informe o endereço de entrega." };

  const tel = String(input.telefone).replace(/\D/g, "");
  const subtotal = itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);
  const taxa = input.tipo_entrega === "delivery" ? await getTaxaEntrega(supabase) : 0;
  const pct = Math.max(0, Math.min(100, Number(input.percentual_desconto ?? 0)));
  const desconto = Number(((subtotal * pct) / 100).toFixed(2));
  const total = Number((subtotal + taxa - desconto).toFixed(2));

  // Cliente: reaproveita por telefone ou cria.
  let clienteId: string;
  const { data: existente } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefone", tel)
    .maybeSingle();

  if (existente) {
    clienteId = existente.id;
    const patch: { nome: string; endereco?: string } = { nome: input.nome.trim() };
    if (input.endereco?.trim()) patch.endereco = input.endereco.trim();
    await supabase.from("clientes").update(patch).eq("id", clienteId);
  } else {
    const { data: novo, error: cErr } = await supabase
      .from("clientes")
      .insert({ nome: input.nome.trim(), telefone: tel, endereco: input.endereco?.trim() || null })
      .select("id")
      .single();
    if (cErr) return { ok: false as const, erro: cErr.message };
    clienteId = novo.id;
  }

  // Pedido (canal balcão, status inicial pendente — igual ao fluxo do agente).
  const { data: pedido, error: pErr } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: clienteId,
      canal: "balcao",
      status: "pendente",
      tipo_entrega: input.tipo_entrega,
      endereco_entrega: input.endereco?.trim() || null,
      forma_pagamento: input.forma_pagamento,
      subtotal,
      taxa_entrega: taxa,
      desconto,
      total,
      company_id: input.company_id ?? null,
      company_employee_id: input.company_employee_id ?? null,
    })
    .select("id, numero_pedido")
    .single();
  if (pErr) return { ok: false as const, erro: pErr.message };

  const rows = itens.map((i) => ({
    pedido_id: pedido.id,
    produto_id: i.produto_id,
    nome_produto: i.nome,
    quantidade: i.quantidade,
    preco_unitario: i.preco_unitario,
    total: Number((i.preco_unitario * i.quantidade).toFixed(2)),
    // Composição legível vai na observação — é o que a cozinha (painel) lê.
    observacao: i.composicao || null,
  }));
  const { data: itensCriados, error: iErr } = await supabase
    .from("itens_pedido")
    .insert(rows)
    .select("id, produto_id, nome_produto");
  if (iErr) return { ok: false as const, erro: iErr.message };

  // Congela as opções escolhidas por item (estrutura auditável).
  const opcoesRows: {
    item_pedido_id: string;
    option_id: string;
    nome_congelado: string;
    preco_congelado: number;
  }[] = [];
  for (const item of itens) {
    if (!item.opcoes?.length) continue;
    // casa o item criado pelo produto_id + nome (ordem preservada)
    const criado = (itensCriados ?? []).find(
      (c) => c.produto_id === item.produto_id && c.nome_produto === item.nome,
    );
    if (!criado) continue;
    for (const op of item.opcoes) {
      opcoesRows.push({
        item_pedido_id: criado.id,
        option_id: op.option_id,
        nome_congelado: op.nome,
        preco_congelado: op.preco,
      });
    }
  }
  if (opcoesRows.length) await supabase.from("order_item_options").insert(opcoesRows);

  // Pagamento no ledger + auditoria.
  await supabase.from("order_payments").insert({
    pedido_id: pedido.id,
    forma_pagamento: input.forma_pagamento,
    valor: total,
    registrado_por: user.id,
  });
  await supabase.from("audit_events").insert({
    user_id: user.id,
    unit_id: user.profile?.unit_id ?? null,
    acao: "pedido.criado_balcao",
    entidade: "pedidos",
    entidade_id: pedido.id,
    valores_posteriores: { total, itens: itens.length, canal: "balcao" },
    origem: "erp",
  });

  // Se veio de uma mesa, encerra a comanda vinculando ao pedido criado.
  if (input.comanda_id) {
    await supabase
      .from("comandas")
      .update({ status: "fechada", fechada_em: new Date().toISOString(), pedido_id: pedido.id })
      .eq("id", input.comanda_id);
    revalidatePath("/mesas");
  }

  revalidatePath("/pedidos");
  return { ok: true as const, numeroPedido: pedido.numero_pedido, total };
}
