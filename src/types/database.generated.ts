// Tipos gerados a partir do schema Supabase (projeto qlswjefuinhbtlhauhgj).
// Regenerar com: supabase gen types (ou o MCP Supabase) após mudanças no schema.
// NÃO editar à mão.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      units: {
        Row: { ativa: boolean; created_at: string; id: string; nome: string; slug: string }
        Insert: { ativa?: boolean; created_at?: string; id?: string; nome: string; slug: string }
        Update: { ativa?: boolean; created_at?: string; id?: string; nome?: string; slug?: string }
        Relationships: []
      }
      profiles: {
        Row: { ativo: boolean; created_at: string; id: string; nome: string | null; unit_id: string | null; updated_at: string }
        Insert: { ativo?: boolean; created_at?: string; id: string; nome?: string | null; unit_id?: string | null; updated_at?: string }
        Update: { ativo?: boolean; created_at?: string; id?: string; nome?: string | null; unit_id?: string | null; updated_at?: string }
        Relationships: []
      }
      roles: {
        Row: { descricao: string | null; id: string; nome: string; slug: string }
        Insert: { descricao?: string | null; id?: string; nome: string; slug: string }
        Update: { descricao?: string | null; id?: string; nome?: string; slug?: string }
        Relationships: []
      }
      permissions: {
        Row: { descricao: string | null; id: string; slug: string }
        Insert: { descricao?: string | null; id?: string; slug: string }
        Update: { descricao?: string | null; id?: string; slug?: string }
        Relationships: []
      }
      role_permissions: {
        Row: { permission_id: string; role_id: string }
        Insert: { permission_id: string; role_id: string }
        Update: { permission_id?: string; role_id?: string }
        Relationships: []
      }
      user_roles: {
        Row: { created_at: string; role_id: string; unit_id: string | null; user_id: string }
        Insert: { created_at?: string; role_id: string; unit_id?: string | null; user_id: string }
        Update: { created_at?: string; role_id?: string; unit_id?: string | null; user_id?: string }
        Relationships: []
      }
      audit_events: {
        Row: {
          acao: string; created_at: string; entidade: string | null; entidade_id: string | null
          id: string; justificativa: string | null; origem: string | null; unit_id: string | null
          user_id: string | null; valores_anteriores: Json | null; valores_posteriores: Json | null
        }
        Insert: {
          acao: string; created_at?: string; entidade?: string | null; entidade_id?: string | null
          id?: string; justificativa?: string | null; origem?: string | null; unit_id?: string | null
          user_id?: string | null; valores_anteriores?: Json | null; valores_posteriores?: Json | null
        }
        Update: {
          acao?: string; created_at?: string; entidade?: string | null; entidade_id?: string | null
          id?: string; justificativa?: string | null; origem?: string | null; unit_id?: string | null
          user_id?: string | null; valores_anteriores?: Json | null; valores_posteriores?: Json | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          canal: string; cliente_id: string; company_id: string | null; company_employee_id: string | null
          company_invoice_id: string | null; created_at: string | null; cupom_id: string | null; desconto: number | null
          endereco_entrega: string | null; forma_pagamento: string | null; id: string; numero_pedido: number
          observacao: string | null; status: string | null; subtotal: number | null; taxa_entrega: number | null
          tipo_entrega: string | null; total: number | null; troco_para: number | null; updated_at: string | null
        }
        Insert: {
          canal?: string; cliente_id: string; company_id?: string | null; company_employee_id?: string | null
          company_invoice_id?: string | null; created_at?: string | null; cupom_id?: string | null; desconto?: number | null
          endereco_entrega?: string | null; forma_pagamento?: string | null; id?: string; numero_pedido?: number
          observacao?: string | null; status?: string | null; subtotal?: number | null; taxa_entrega?: number | null
          tipo_entrega?: string | null; total?: number | null; troco_para?: number | null; updated_at?: string | null
        }
        Update: {
          canal?: string; cliente_id?: string; company_id?: string | null; company_employee_id?: string | null
          company_invoice_id?: string | null; created_at?: string | null; cupom_id?: string | null; desconto?: number | null
          endereco_entrega?: string | null; forma_pagamento?: string | null; id?: string; numero_pedido?: number
          observacao?: string | null; status?: string | null; subtotal?: number | null; taxa_entrega?: number | null
          tipo_entrega?: string | null; total?: number | null; troco_para?: number | null; updated_at?: string | null
        }
        Relationships: []
      }
      order_status_history: {
        Row: { id: string; pedido_id: string; status_anterior: string | null; status_novo: string; changed_by: string | null; created_at: string }
        Insert: { id?: string; pedido_id: string; status_anterior?: string | null; status_novo: string; changed_by?: string | null; created_at?: string }
        Update: { id?: string; pedido_id?: string; status_anterior?: string | null; status_novo?: string; changed_by?: string | null; created_at?: string }
        Relationships: []
      }
      order_payments: {
        Row: { id: string; pedido_id: string; forma_pagamento: string; valor: number; recebido_em: string; registrado_por: string | null; created_at: string }
        Insert: { id?: string; pedido_id: string; forma_pagamento: string; valor: number; recebido_em?: string; registrado_por?: string | null; created_at?: string }
        Update: { id?: string; pedido_id?: string; forma_pagamento?: string; valor?: number; recebido_em?: string; registrado_por?: string | null; created_at?: string }
        Relationships: []
      }
      order_discounts: {
        Row: { id: string; pedido_id: string; valor: number; motivo: string; aplicado_por: string | null; created_at: string }
        Insert: { id?: string; pedido_id: string; valor: number; motivo: string; aplicado_por?: string | null; created_at?: string }
        Update: { id?: string; pedido_id?: string; valor?: number; motivo?: string; aplicado_por?: string | null; created_at?: string }
        Relationships: []
      }
      order_cancellations: {
        Row: { id: string; pedido_id: string; motivo: string; valor_estornado: number; cancelado_por: string | null; created_at: string }
        Insert: { id?: string; pedido_id: string; motivo: string; valor_estornado?: number; cancelado_por?: string | null; created_at?: string }
        Update: { id?: string; pedido_id?: string; motivo?: string; valor_estornado?: number; cancelado_por?: string | null; created_at?: string }
        Relationships: []
      }
      itens_pedido: {
        Row: {
          created_at: string | null; id: string; nome_produto: string; observacao: string | null
          pedido_id: string; preco_unitario: number; produto_id: string | null; quantidade: number; total: number
        }
        Insert: {
          created_at?: string | null; id?: string; nome_produto: string; observacao?: string | null
          pedido_id: string; preco_unitario: number; produto_id?: string | null; quantidade?: number; total: number
        }
        Update: {
          created_at?: string | null; id?: string; nome_produto?: string; observacao?: string | null
          pedido_id?: string; preco_unitario?: number; produto_id?: string | null; quantidade?: number; total?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: string; nome: string; telefone: string; endereco: string | null
          total_pedidos: number | null; total_gasto: number | null; created_at: string | null
          ultimo_pedido: string | null; primeiro_pedido: string | null
        }
        Insert: {
          id?: string; nome: string; telefone: string; endereco?: string | null
          total_pedidos?: number | null; total_gasto?: number | null; created_at?: string | null
          ultimo_pedido?: string | null; primeiro_pedido?: string | null
        }
        Update: {
          id?: string; nome?: string; telefone?: string; endereco?: string | null
          total_pedidos?: number | null; total_gasto?: number | null; created_at?: string | null
          ultimo_pedido?: string | null; primeiro_pedido?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          id: string; nome: string; categoria: string | null; descricao: string | null
          preco: number; preco_promocional: number | null; disponivel: boolean | null
          destaque: boolean | null; imagem_url: string | null; created_at: string | null
        }
        Insert: {
          id?: string; nome: string; categoria?: string | null; descricao?: string | null
          preco: number; preco_promocional?: number | null; disponivel?: boolean | null
          destaque?: boolean | null; imagem_url?: string | null; created_at?: string | null
        }
        Update: {
          id?: string; nome?: string; categoria?: string | null; descricao?: string | null
          preco?: number; preco_promocional?: number | null; disponivel?: boolean | null
          destaque?: boolean | null; imagem_url?: string | null; created_at?: string | null
        }
        Relationships: []
      }
      info_restaurante: {
        Row: { id: string; chave: string; valor: string; descricao: string | null }
        Insert: { id?: string; chave: string; valor: string; descricao?: string | null }
        Update: { id?: string; chave?: string; valor?: string; descricao?: string | null }
        Relationships: []
      }
      option_groups: {
        Row: { id: string; nome: string; min_escolhas: number; max_escolhas: number | null; created_at: string }
        Insert: { id?: string; nome: string; min_escolhas?: number; max_escolhas?: number | null; created_at?: string }
        Update: { id?: string; nome?: string; min_escolhas?: number; max_escolhas?: number | null; created_at?: string }
        Relationships: []
      }
      options: {
        Row: { id: string; group_id: string; nome: string; preco_adicional: number; disponivel: boolean; ordem: number }
        Insert: { id?: string; group_id: string; nome: string; preco_adicional?: number; disponivel?: boolean; ordem?: number }
        Update: { id?: string; group_id?: string; nome?: string; preco_adicional?: number; disponivel?: boolean; ordem?: number }
        Relationships: []
      }
      product_option_groups: {
        Row: { produto_id: string; group_id: string; ordem: number }
        Insert: { produto_id: string; group_id: string; ordem?: number }
        Update: { produto_id?: string; group_id?: string; ordem?: number }
        Relationships: []
      }
      order_item_options: {
        Row: { id: string; item_pedido_id: string; option_id: string | null; nome_congelado: string; preco_congelado: number; created_at: string }
        Insert: { id?: string; item_pedido_id: string; option_id?: string | null; nome_congelado: string; preco_congelado?: number; created_at?: string }
        Update: { id?: string; item_pedido_id?: string; option_id?: string | null; nome_congelado?: string; preco_congelado?: number; created_at?: string }
        Relationships: []
      }
      companies: {
        Row: {
          id: string; unit_id: string | null; razao_social: string; nome_fantasia: string | null; cnpj: string | null
          whatsapp: string | null; responsavel_financeiro: string | null; percentual_desconto: number
          dia_fechamento: number | null; dia_vencimento: number | null; limite_credito: number; ativo: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; unit_id?: string | null; razao_social: string; nome_fantasia?: string | null; cnpj?: string | null
          whatsapp?: string | null; responsavel_financeiro?: string | null; percentual_desconto?: number
          dia_fechamento?: number | null; dia_vencimento?: number | null; limite_credito?: number; ativo?: boolean
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; unit_id?: string | null; razao_social?: string; nome_fantasia?: string | null; cnpj?: string | null
          whatsapp?: string | null; responsavel_financeiro?: string | null; percentual_desconto?: number
          dia_fechamento?: number | null; dia_vencimento?: number | null; limite_credito?: number; ativo?: boolean
          created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      company_employees: {
        Row: {
          id: string; company_id: string; nome: string; telefone: string | null; cpf: string | null
          matricula: string | null; setor: string | null; limite_mensal: number; limite_diario: number
          ativo: boolean; created_at: string
        }
        Insert: {
          id?: string; company_id: string; nome: string; telefone?: string | null; cpf?: string | null
          matricula?: string | null; setor?: string | null; limite_mensal?: number; limite_diario?: number
          ativo?: boolean; created_at?: string
        }
        Update: {
          id?: string; company_id?: string; nome?: string; telefone?: string | null; cpf?: string | null
          matricula?: string | null; setor?: string | null; limite_mensal?: number; limite_diario?: number
          ativo?: boolean; created_at?: string
        }
        Relationships: []
      }
      company_invoices: {
        Row: {
          id: string; company_id: string; unit_id: string | null; periodo_inicio: string; periodo_fim: string
          status: string; subtotal: number; desconto: number; total: number; itens_count: number
          fechada_por: string | null; fechada_em: string; created_at: string
        }
        Insert: {
          id?: string; company_id: string; unit_id?: string | null; periodo_inicio: string; periodo_fim: string
          status?: string; subtotal?: number; desconto?: number; total?: number; itens_count?: number
          fechada_por?: string | null; fechada_em?: string; created_at?: string
        }
        Update: {
          id?: string; company_id?: string; unit_id?: string | null; periodo_inicio?: string; periodo_fim?: string
          status?: string; subtotal?: number; desconto?: number; total?: number; itens_count?: number
          fechada_por?: string | null; fechada_em?: string; created_at?: string
        }
        Relationships: []
      }
      company_invoice_items: {
        Row: {
          id: string; invoice_id: string; pedido_id: string | null; company_employee_id: string | null
          employee_nome: string | null; numero_pedido: number | null; data_pedido: string | null
          descricao: string | null; valor: number
        }
        Insert: {
          id?: string; invoice_id: string; pedido_id?: string | null; company_employee_id?: string | null
          employee_nome?: string | null; numero_pedido?: number | null; data_pedido?: string | null
          descricao?: string | null; valor?: number
        }
        Update: {
          id?: string; invoice_id?: string; pedido_id?: string | null; company_employee_id?: string | null
          employee_nome?: string | null; numero_pedido?: number | null; data_pedido?: string | null
          descricao?: string | null; valor?: number
        }
        Relationships: []
      }
      receivables: {
        Row: {
          id: string; company_id: string | null; company_invoice_id: string | null; unit_id: string | null
          descricao: string; valor: number; vencimento: string | null; status: string
          pago_em: string | null; recebido_por: string | null; created_at: string
        }
        Insert: {
          id?: string; company_id?: string | null; company_invoice_id?: string | null; unit_id?: string | null
          descricao: string; valor: number; vencimento?: string | null; status?: string
          pago_em?: string | null; recebido_por?: string | null; created_at?: string
        }
        Update: {
          id?: string; company_id?: string | null; company_invoice_id?: string | null; unit_id?: string | null
          descricao?: string; valor?: number; vencimento?: string | null; status?: string
          pago_em?: string | null; recebido_por?: string | null; created_at?: string
        }
        Relationships: []
      }
      measurement_units: {
        Row: { id: string; sigla: string; nome: string }
        Insert: { id?: string; sigla: string; nome: string }
        Update: { id?: string; sigla?: string; nome?: string }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string; unit_id: string | null; measure_id: string | null; nome: string; categoria: string | null
          estoque_minimo: number; custo_atual: number; ativo: boolean; created_at: string
        }
        Insert: {
          id?: string; unit_id?: string | null; measure_id?: string | null; nome: string; categoria?: string | null
          estoque_minimo?: number; custo_atual?: number; ativo?: boolean; created_at?: string
        }
        Update: {
          id?: string; unit_id?: string | null; measure_id?: string | null; nome?: string; categoria?: string | null
          estoque_minimo?: number; custo_atual?: number; ativo?: boolean; created_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: string; item_id: string; tipo: string; quantidade: number; custo_unitario: number | null
          motivo: string | null; count_id: string | null; created_by: string | null; created_at: string
        }
        Insert: {
          id?: string; item_id: string; tipo: string; quantidade: number; custo_unitario?: number | null
          motivo?: string | null; count_id?: string | null; created_by?: string | null; created_at?: string
        }
        Update: {
          id?: string; item_id?: string; tipo?: string; quantidade?: number; custo_unitario?: number | null
          motivo?: string | null; count_id?: string | null; created_by?: string | null; created_at?: string
        }
        Relationships: []
      }
      stock_counts: {
        Row: { id: string; unit_id: string | null; status: string; observacao: string | null; created_by: string | null; created_at: string; fechada_em: string | null }
        Insert: { id?: string; unit_id?: string | null; status?: string; observacao?: string | null; created_by?: string | null; created_at?: string; fechada_em?: string | null }
        Update: { id?: string; unit_id?: string | null; status?: string; observacao?: string | null; created_by?: string | null; created_at?: string; fechada_em?: string | null }
        Relationships: []
      }
      stock_count_items: {
        Row: { id: string; count_id: string; item_id: string; qtd_sistema: number; qtd_contada: number | null; diferenca: number | null }
        Insert: { id?: string; count_id: string; item_id: string; qtd_sistema?: number; qtd_contada?: number | null; diferenca?: number | null }
        Update: { id?: string; count_id?: string; item_id?: string; qtd_sistema?: number; qtd_contada?: number | null; diferenca?: number | null }
        Relationships: []
      }
      v_inventory_balance: {
        Row: { item_id: string; saldo: number }
        Insert: { item_id?: string; saldo?: number }
        Update: { item_id?: string; saldo?: number }
        Relationships: []
      }
      recipes: {
        Row: { id: string; produto_id: string; nome: string; created_at: string }
        Insert: { id?: string; produto_id: string; nome: string; created_at?: string }
        Update: { id?: string; produto_id?: string; nome?: string; created_at?: string }
        Relationships: []
      }
      recipe_versions: {
        Row: { id: string; recipe_id: string; versao: number; ativa: boolean; rendimento: number; observacao: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; recipe_id: string; versao?: number; ativa?: boolean; rendimento?: number; observacao?: string | null; created_by?: string | null; created_at?: string }
        Update: { id?: string; recipe_id?: string; versao?: number; ativa?: boolean; rendimento?: number; observacao?: string | null; created_by?: string | null; created_at?: string }
        Relationships: []
      }
      recipe_items: {
        Row: { id: string; version_id: string; inventory_item_id: string; quantidade: number }
        Insert: { id?: string; version_id: string; inventory_item_id: string; quantidade?: number }
        Update: { id?: string; version_id?: string; inventory_item_id?: string; quantidade?: number }
        Relationships: []
      }
      v_recipe_cost: {
        Row: { recipe_id: string; version_id: string; custo_porcao: number }
        Insert: { recipe_id?: string; version_id?: string; custo_porcao?: number }
        Update: { recipe_id?: string; version_id?: string; custo_porcao?: number }
        Relationships: []
      }
      suppliers: {
        Row: { id: string; unit_id: string | null; nome: string; cnpj: string | null; whatsapp: string | null; contato: string | null; ativo: boolean; created_at: string }
        Insert: { id?: string; unit_id?: string | null; nome: string; cnpj?: string | null; whatsapp?: string | null; contato?: string | null; ativo?: boolean; created_at?: string }
        Update: { id?: string; unit_id?: string | null; nome?: string; cnpj?: string | null; whatsapp?: string | null; contato?: string | null; ativo?: boolean; created_at?: string }
        Relationships: []
      }
      purchases: {
        Row: { id: string; supplier_id: string | null; unit_id: string | null; status: string; total: number; observacao: string | null; created_by: string | null; created_at: string; confirmada_em: string | null }
        Insert: { id?: string; supplier_id?: string | null; unit_id?: string | null; status?: string; total?: number; observacao?: string | null; created_by?: string | null; created_at?: string; confirmada_em?: string | null }
        Update: { id?: string; supplier_id?: string | null; unit_id?: string | null; status?: string; total?: number; observacao?: string | null; created_by?: string | null; created_at?: string; confirmada_em?: string | null }
        Relationships: []
      }
      purchase_items: {
        Row: { id: string; purchase_id: string; inventory_item_id: string; quantidade: number; custo_unitario: number; total: number }
        Insert: { id?: string; purchase_id: string; inventory_item_id: string; quantidade: number; custo_unitario?: number; total?: number }
        Update: { id?: string; purchase_id?: string; inventory_item_id?: string; quantidade?: number; custo_unitario?: number; total?: number }
        Relationships: []
      }
      payables: {
        Row: { id: string; supplier_id: string | null; purchase_id: string | null; unit_id: string | null; descricao: string; valor: number; vencimento: string | null; status: string; pago_em: string | null; pago_por: string | null; created_at: string }
        Insert: { id?: string; supplier_id?: string | null; purchase_id?: string | null; unit_id?: string | null; descricao: string; valor: number; vencimento?: string | null; status?: string; pago_em?: string | null; pago_por?: string | null; created_at?: string }
        Update: { id?: string; supplier_id?: string | null; purchase_id?: string | null; unit_id?: string | null; descricao?: string; valor?: number; vencimento?: string | null; status?: string; pago_em?: string | null; pago_por?: string | null; created_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_user_role_slugs: { Args: Record<string, never>; Returns: string[] }
      is_gestor: { Args: Record<string, never>; Returns: boolean }
      user_has_permission: { Args: { perm: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
