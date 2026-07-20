export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_logs: {
        Row: {
          created_at: string | null
          dados: Json | null
          erro_stack: string | null
          etapa: string
          id: number
          mensagem: string | null
          nivel: string | null
          request_id: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          dados?: Json | null
          erro_stack?: string | null
          etapa: string
          id?: never
          mensagem?: string | null
          nivel?: string | null
          request_id?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          dados?: Json | null
          erro_stack?: string | null
          etapa?: string
          id?: never
          mensagem?: string | null
          nivel?: string | null
          request_id?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          acao: string
          created_at: string
          entidade: string | null
          entidade_id: string | null
          id: string
          justificativa: string | null
          origem: string | null
          unit_id: string | null
          user_id: string | null
          valores_anteriores: Json | null
          valores_posteriores: Json | null
        }
        Insert: {
          acao: string
          created_at?: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          justificativa?: string | null
          origem?: string | null
          unit_id?: string | null
          user_id?: string | null
          valores_anteriores?: Json | null
          valores_posteriores?: Json | null
        }
        Update: {
          acao?: string
          created_at?: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          justificativa?: string | null
          origem?: string | null
          unit_id?: string | null
          user_id?: string | null
          valores_anteriores?: Json | null
          valores_posteriores?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          motivo: string | null
          session_id: string
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          motivo?: string | null
          session_id: string
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          motivo?: string | null
          session_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          aberta_em: string
          created_at: string
          fechada_em: string | null
          fechamento: Json | null
          id: string
          observacao: string | null
          operador_id: string | null
          saldo_inicial: number
          status: string
          unit_id: string | null
        }
        Insert: {
          aberta_em?: string
          created_at?: string
          fechada_em?: string | null
          fechamento?: Json | null
          id?: string
          observacao?: string | null
          operador_id?: string | null
          saldo_inicial?: number
          status?: string
          unit_id?: string | null
        }
        Update: {
          aberta_em?: string
          created_at?: string
          fechada_em?: string | null
          fechamento?: Json | null
          id?: string
          observacao?: string | null
          operador_id?: string | null
          saldo_inicial?: number
          status?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          codigo: string
          id: string
          nome: string
          ordem: number
          tipo: string
        }
        Insert: {
          codigo: string
          id?: string
          nome: string
          ordem?: number
          tipo: string
        }
        Update: {
          codigo?: string
          id?: string
          nome?: string
          ordem?: number
          tipo?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cadencia_pausada_ate: string | null
          created_at: string | null
          data_ultima_interacao: string | null
          endereco: string | null
          foi_indicado_por: string | null
          id: string
          indicacao_solicitada_em: string | null
          indicacoes_coletadas: number
          motivo_saida_indicacao:
            | Database["public"]["Enums"]["motivo_saida_indicacao_enum"]
            | null
          nome: string
          primeiro_pedido: string | null
          proxima_indicacao_em: string | null
          sessao_status: Database["public"]["Enums"]["sessao_status_enum"]
          status_cadencia: Database["public"]["Enums"]["status_cadencia_enum"]
          telefone: string
          total_gasto: number | null
          total_pedidos: number | null
          ultima_faixa_enviada: number | null
          ultima_interacao_indicacao_em: string | null
          ultima_oferta_enviada_em: string | null
          ultimo_pedido: string | null
          updated_at: string | null
        }
        Insert: {
          cadencia_pausada_ate?: string | null
          created_at?: string | null
          data_ultima_interacao?: string | null
          endereco?: string | null
          foi_indicado_por?: string | null
          id?: string
          indicacao_solicitada_em?: string | null
          indicacoes_coletadas?: number
          motivo_saida_indicacao?:
            | Database["public"]["Enums"]["motivo_saida_indicacao_enum"]
            | null
          nome: string
          primeiro_pedido?: string | null
          proxima_indicacao_em?: string | null
          sessao_status?: Database["public"]["Enums"]["sessao_status_enum"]
          status_cadencia?: Database["public"]["Enums"]["status_cadencia_enum"]
          telefone: string
          total_gasto?: number | null
          total_pedidos?: number | null
          ultima_faixa_enviada?: number | null
          ultima_interacao_indicacao_em?: string | null
          ultima_oferta_enviada_em?: string | null
          ultimo_pedido?: string | null
          updated_at?: string | null
        }
        Update: {
          cadencia_pausada_ate?: string | null
          created_at?: string | null
          data_ultima_interacao?: string | null
          endereco?: string | null
          foi_indicado_por?: string | null
          id?: string
          indicacao_solicitada_em?: string | null
          indicacoes_coletadas?: number
          motivo_saida_indicacao?:
            | Database["public"]["Enums"]["motivo_saida_indicacao_enum"]
            | null
          nome?: string
          primeiro_pedido?: string | null
          proxima_indicacao_em?: string | null
          sessao_status?: Database["public"]["Enums"]["sessao_status_enum"]
          status_cadencia?: Database["public"]["Enums"]["status_cadencia_enum"]
          telefone?: string
          total_gasto?: number | null
          total_pedidos?: number | null
          ultima_faixa_enviada?: number | null
          ultima_interacao_indicacao_em?: string | null
          ultima_oferta_enviada_em?: string | null
          ultimo_pedido?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_foi_indicado_por_fkey"
            columns: ["foi_indicado_por"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas_impressas: {
        Row: {
          atendente_id: string | null
          atendente_nome: string | null
          criado_em: string
          custo_total_estimado: number | null
          id: string
          itens_snapshot: Json
          tamanho: string
        }
        Insert: {
          atendente_id?: string | null
          atendente_nome?: string | null
          criado_em?: string
          custo_total_estimado?: number | null
          id?: string
          itens_snapshot: Json
          tamanho: string
        }
        Update: {
          atendente_id?: string | null
          atendente_nome?: string | null
          criado_em?: string
          custo_total_estimado?: number | null
          id?: string
          itens_snapshot?: Json
          tamanho?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          dia_fechamento: number | null
          dia_vencimento: number | null
          id: string
          limite_credito: number
          nome_fantasia: string | null
          percentual_desconto: number
          razao_social: string
          responsavel_financeiro: string | null
          unit_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          id?: string
          limite_credito?: number
          nome_fantasia?: string | null
          percentual_desconto?: number
          razao_social: string
          responsavel_financeiro?: string | null
          unit_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          id?: string
          limite_credito?: number
          nome_fantasia?: string | null
          percentual_desconto?: number
          razao_social?: string
          responsavel_financeiro?: string | null
          unit_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      company_employees: {
        Row: {
          ativo: boolean
          company_id: string
          cpf: string | null
          created_at: string
          id: string
          limite_diario: number
          limite_mensal: number
          matricula: string | null
          nome: string
          setor: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          company_id: string
          cpf?: string | null
          created_at?: string
          id?: string
          limite_diario?: number
          limite_mensal?: number
          matricula?: string | null
          nome: string
          setor?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          company_id?: string
          cpf?: string | null
          created_at?: string
          id?: string
          limite_diario?: number
          limite_mensal?: number
          matricula?: string | null
          nome?: string
          setor?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invoice_items: {
        Row: {
          company_employee_id: string | null
          data_pedido: string | null
          descricao: string | null
          employee_nome: string | null
          id: string
          invoice_id: string
          numero_pedido: number | null
          pedido_id: string | null
          valor: number
        }
        Insert: {
          company_employee_id?: string | null
          data_pedido?: string | null
          descricao?: string | null
          employee_nome?: string | null
          id?: string
          invoice_id: string
          numero_pedido?: number | null
          pedido_id?: string | null
          valor?: number
        }
        Update: {
          company_employee_id?: string | null
          data_pedido?: string | null
          descricao?: string | null
          employee_nome?: string | null
          id?: string
          invoice_id?: string
          numero_pedido?: number | null
          pedido_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_invoice_items_company_employee_id_fkey"
            columns: ["company_employee_id"]
            isOneToOne: false
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "company_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invoice_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invoices: {
        Row: {
          company_id: string
          created_at: string
          desconto: number
          fechada_em: string
          fechada_por: string | null
          id: string
          itens_count: number
          periodo_fim: string
          periodo_inicio: string
          status: string
          subtotal: number
          total: number
          unit_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          desconto?: number
          fechada_em?: string
          fechada_por?: string | null
          id?: string
          itens_count?: number
          periodo_fim: string
          periodo_inicio: string
          status?: string
          subtotal?: number
          total?: number
          unit_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          desconto?: number
          fechada_em?: string
          fechada_por?: string | null
          id?: string
          itens_count?: number
          periodo_fim?: string
          periodo_inicio?: string
          status?: string
          subtotal?: number
          total?: number
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      config_porcionamento: {
        Row: {
          ativo: boolean
          atualizado_em: string
          id: string
          inventory_item_id: string
          observacao: string | null
          quantidade: number
          tamanho: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          id?: string
          inventory_item_id: string
          observacao?: string | null
          quantidade: number
          tamanho: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          id?: string
          inventory_item_id?: string
          observacao?: string | null
          quantidade?: number
          tamanho?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_porcionamento_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_porcionamento_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_balance"
            referencedColumns: ["item_id"]
          },
        ]
      }
      conversas: {
        Row: {
          agente: string
          cliente_id: string | null
          cupom_contexto_id: string | null
          id: string
          mensagens: Json | null
          oferta_contexto_id: string | null
          telefone: string
          updated_at: string | null
        }
        Insert: {
          agente: string
          cliente_id?: string | null
          cupom_contexto_id?: string | null
          id?: string
          mensagens?: Json | null
          oferta_contexto_id?: string | null
          telefone: string
          updated_at?: string | null
        }
        Update: {
          agente?: string
          cliente_id?: string | null
          cupom_contexto_id?: string | null
          id?: string
          mensagens?: Json | null
          oferta_contexto_id?: string | null
          telefone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_cupom_contexto_id_fkey"
            columns: ["cupom_contexto_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_oferta_contexto_id_fkey"
            columns: ["oferta_contexto_id"]
            isOneToOne: false
            referencedRelation: "ofertas_enviadas"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          ativo: boolean
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          cliente_id: string
          codigo: string
          created_at: string | null
          desconto_percentual: number
          id: string
          pedido_id: string | null
          usado: boolean | null
          valido_ate: string
        }
        Insert: {
          cliente_id: string
          codigo: string
          created_at?: string | null
          desconto_percentual: number
          id?: string
          pedido_id?: string | null
          usado?: boolean | null
          valido_ate: string
        }
        Update: {
          cliente_id?: string
          codigo?: string
          created_at?: string | null
          desconto_percentual?: number
          id?: string
          pedido_id?: string | null
          usado?: boolean | null
          valido_ate?: string
        }
        Relationships: [
          {
            foreignKeyName: "cupons_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      indicacoes: {
        Row: {
          cliente_id: string | null
          convertido_em: string | null
          created_at: string | null
          id: string
          indicado_por: string
          nome_indicado: string
          status: string | null
          telefone_indicado: string
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          convertido_em?: string | null
          created_at?: string | null
          id?: string
          indicado_por: string
          nome_indicado: string
          status?: string | null
          telefone_indicado: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          convertido_em?: string | null
          created_at?: string | null
          id?: string
          indicado_por?: string
          nome_indicado?: string
          status?: string | null
          telefone_indicado?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_indicado_por_fkey"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      info_restaurante: {
        Row: {
          chave: string
          descricao: string | null
          id: string
          valor: string
        }
        Insert: {
          chave: string
          descricao?: string | null
          id?: string
          valor: string
        }
        Update: {
          chave?: string
          descricao?: string | null
          id?: string
          valor?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          custo_atual: number
          estoque_minimo: number
          id: string
          measure_id: string | null
          nome: string
          porc_ativo: boolean
          porc_categoria: string | null
          porc_custo_kg_pronto: number | null
          porc_custo_por_porcao: number | null
          porc_fator_rendimento: number | null
          porc_peso_g: number | null
          porc_subcategoria: string | null
          porc_tipo: string | null
          unit_id: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          custo_atual?: number
          estoque_minimo?: number
          id?: string
          measure_id?: string | null
          nome: string
          porc_ativo?: boolean
          porc_categoria?: string | null
          porc_custo_kg_pronto?: number | null
          porc_custo_por_porcao?: number | null
          porc_fator_rendimento?: number | null
          porc_peso_g?: number | null
          porc_subcategoria?: string | null
          porc_tipo?: string | null
          unit_id?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          custo_atual?: number
          estoque_minimo?: number
          id?: string
          measure_id?: string | null
          nome?: string
          porc_ativo?: boolean
          porc_categoria?: string | null
          porc_custo_kg_pronto?: number | null
          porc_custo_por_porcao?: number | null
          porc_fator_rendimento?: number | null
          porc_peso_g?: number | null
          porc_subcategoria?: string | null
          porc_tipo?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_measure_id_fkey"
            columns: ["measure_id"]
            isOneToOne: false
            referencedRelation: "measurement_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_do_dia: {
        Row: {
          ativo: boolean
          criado_em: string
          data: string
          id: string
          inventory_item_id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          data?: string
          id?: string
          inventory_item_id: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          data?: string
          id?: string
          inventory_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_do_dia_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_do_dia_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_balance"
            referencedColumns: ["item_id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          created_at: string | null
          id: string
          nome_produto: string
          observacao: string | null
          pedido_id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          total: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome_produto: string
          observacao?: string | null
          pedido_id: string
          preco_unitario: number
          produto_id?: string | null
          quantidade?: number
          total: number
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_produto?: string
          observacao?: string | null
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_units: {
        Row: {
          id: string
          nome: string
          sigla: string
        }
        Insert: {
          id?: string
          nome: string
          sigla: string
        }
        Update: {
          id?: string
          nome?: string
          sigla?: string
        }
        Relationships: []
      }
      misturas_do_dia: {
        Row: {
          ativo: boolean
          created_at: string | null
          descricao: string
          id: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          descricao: string
          id?: string
          titulo?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          descricao?: string
          id?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          created_at: string | null
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      ofertas_enviadas: {
        Row: {
          cliente_id: string
          converteu: boolean | null
          cupom_codigo: string | null
          cupom_id: string | null
          desconto_percentual: number | null
          dias_sem_comprar: number
          enviado_em: string | null
          faixa_cadencia: number
          id: string
          mensagem_audio: string | null
          mensagem_cta: string | null
          mensagem_video: string | null
          pedido_convertido_id: string | null
          tipo_oferta: string
        }
        Insert: {
          cliente_id: string
          converteu?: boolean | null
          cupom_codigo?: string | null
          cupom_id?: string | null
          desconto_percentual?: number | null
          dias_sem_comprar: number
          enviado_em?: string | null
          faixa_cadencia: number
          id?: string
          mensagem_audio?: string | null
          mensagem_cta?: string | null
          mensagem_video?: string | null
          pedido_convertido_id?: string | null
          tipo_oferta: string
        }
        Update: {
          cliente_id?: string
          converteu?: boolean | null
          cupom_codigo?: string | null
          cupom_id?: string | null
          desconto_percentual?: number | null
          dias_sem_comprar?: number
          enviado_em?: string | null
          faixa_cadencia?: number
          id?: string
          mensagem_audio?: string | null
          mensagem_cta?: string | null
          mensagem_video?: string | null
          pedido_convertido_id?: string | null
          tipo_oferta?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_enviadas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_enviadas_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_enviadas_pedido_convertido_id_fkey"
            columns: ["pedido_convertido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      option_groups: {
        Row: {
          created_at: string
          id: string
          max_escolhas: number | null
          min_escolhas: number
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_escolhas?: number | null
          min_escolhas?: number
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          max_escolhas?: number | null
          min_escolhas?: number
          nome?: string
        }
        Relationships: []
      }
      options: {
        Row: {
          disponivel: boolean
          group_id: string
          id: string
          nome: string
          ordem: number
          preco_adicional: number
        }
        Insert: {
          disponivel?: boolean
          group_id: string
          id?: string
          nome: string
          ordem?: number
          preco_adicional?: number
        }
        Update: {
          disponivel?: boolean
          group_id?: string
          id?: string
          nome?: string
          ordem?: number
          preco_adicional?: number
        }
        Relationships: [
          {
            foreignKeyName: "options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_cancellations: {
        Row: {
          cancelado_por: string | null
          created_at: string
          id: string
          motivo: string
          pedido_id: string
          valor_estornado: number
        }
        Insert: {
          cancelado_por?: string | null
          created_at?: string
          id?: string
          motivo: string
          pedido_id: string
          valor_estornado?: number
        }
        Update: {
          cancelado_por?: string | null
          created_at?: string
          id?: string
          motivo?: string
          pedido_id?: string
          valor_estornado?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_cancellations_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      order_discounts: {
        Row: {
          aplicado_por: string | null
          created_at: string
          id: string
          motivo: string
          pedido_id: string
          valor: number
        }
        Insert: {
          aplicado_por?: string | null
          created_at?: string
          id?: string
          motivo: string
          pedido_id: string
          valor: number
        }
        Update: {
          aplicado_por?: string | null
          created_at?: string
          id?: string
          motivo?: string
          pedido_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_discounts_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_options: {
        Row: {
          created_at: string
          id: string
          item_pedido_id: string
          nome_congelado: string
          option_id: string | null
          preco_congelado: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_pedido_id: string
          nome_congelado: string
          option_id?: string | null
          preco_congelado?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_pedido_id?: string
          nome_congelado?: string
          option_id?: string | null
          preco_congelado?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_options_item_pedido_id_fkey"
            columns: ["item_pedido_id"]
            isOneToOne: false
            referencedRelation: "itens_pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          created_at: string
          forma_pagamento: string
          id: string
          pedido_id: string
          recebido_em: string
          registrado_por: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          forma_pagamento: string
          id?: string
          pedido_id: string
          recebido_em?: string
          registrado_por?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          forma_pagamento?: string
          id?: string
          pedido_id?: string
          recebido_em?: string
          registrado_por?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          pedido_id: string
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          pedido_id: string
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          pedido_id?: string
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          account_id: string | null
          cost_center_id: string | null
          created_at: string
          descricao: string
          id: string
          pago_em: string | null
          pago_por: string | null
          purchase_id: string | null
          recorrente: boolean
          status: string
          supplier_id: string | null
          unit_id: string | null
          valor: number
          vencimento: string | null
        }
        Insert: {
          account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          pago_em?: string | null
          pago_por?: string | null
          purchase_id?: string | null
          recorrente?: boolean
          status?: string
          supplier_id?: string | null
          unit_id?: string | null
          valor: number
          vencimento?: string | null
        }
        Update: {
          account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          pago_em?: string | null
          pago_por?: string | null
          purchase_id?: string | null
          recorrente?: boolean
          status?: string
          supplier_id?: string | null
          unit_id?: string | null
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payables_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_rascunho: {
        Row: {
          endereco: string | null
          etapa_atual: string | null
          forma_pagamento: string | null
          itens: Json | null
          nome_cliente: string | null
          telefone: string
          tipo_entrega: string | null
          updated_at: string | null
        }
        Insert: {
          endereco?: string | null
          etapa_atual?: string | null
          forma_pagamento?: string | null
          itens?: Json | null
          nome_cliente?: string | null
          telefone: string
          tipo_entrega?: string | null
          updated_at?: string | null
        }
        Update: {
          endereco?: string | null
          etapa_atual?: string | null
          forma_pagamento?: string | null
          itens?: Json | null
          nome_cliente?: string | null
          telefone?: string
          tipo_entrega?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          canal: string
          cliente_id: string
          company_employee_id: string | null
          company_id: string | null
          company_invoice_id: string | null
          created_at: string | null
          cupom_id: string | null
          desconto: number | null
          endereco_entrega: string | null
          estoque_baixado: boolean
          forma_pagamento: string | null
          id: string
          numero_pedido: number
          observacao: string | null
          status: string | null
          subtotal: number | null
          taxa_entrega: number | null
          tipo_entrega: string | null
          total: number | null
          troco_para: number | null
          updated_at: string | null
        }
        Insert: {
          canal?: string
          cliente_id: string
          company_employee_id?: string | null
          company_id?: string | null
          company_invoice_id?: string | null
          created_at?: string | null
          cupom_id?: string | null
          desconto?: number | null
          endereco_entrega?: string | null
          estoque_baixado?: boolean
          forma_pagamento?: string | null
          id?: string
          numero_pedido?: number
          observacao?: string | null
          status?: string | null
          subtotal?: number | null
          taxa_entrega?: number | null
          tipo_entrega?: string | null
          total?: number | null
          troco_para?: number | null
          updated_at?: string | null
        }
        Update: {
          canal?: string
          cliente_id?: string
          company_employee_id?: string | null
          company_id?: string | null
          company_invoice_id?: string | null
          created_at?: string | null
          cupom_id?: string | null
          desconto?: number | null
          endereco_entrega?: string | null
          estoque_baixado?: boolean
          forma_pagamento?: string | null
          id?: string
          numero_pedido?: number
          observacao?: string | null
          status?: string | null
          subtotal?: number | null
          taxa_entrega?: number | null
          tipo_entrega?: string | null
          total?: number | null
          troco_para?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pedido_cupom"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_company_employee_id_fkey"
            columns: ["company_employee_id"]
            isOneToOne: false
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_company_invoice_id_fkey"
            columns: ["company_invoice_id"]
            isOneToOne: false
            referencedRelation: "company_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          descricao: string | null
          id: string
          slug: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          slug: string
        }
        Update: {
          descricao?: string | null
          id?: string
          slug?: string
        }
        Relationships: []
      }
      product_option_groups: {
        Row: {
          group_id: string
          ordem: number
          produto_id: string
        }
        Insert: {
          group_id: string
          ordem?: number
          produto_id: string
        }
        Update: {
          group_id?: string
          ordem?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_option_groups_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          disponivel: boolean | null
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          preco_delivery: number | null
          preco_promocional: number | null
          video_url: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          disponivel?: boolean | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco: number
          preco_delivery?: number | null
          preco_promocional?: number | null
          video_url?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          disponivel?: boolean | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          preco_delivery?: number | null
          preco_promocional?: number | null
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          nome?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          custo_unitario: number
          id: string
          inventory_item_id: string
          purchase_id: string
          quantidade: number
          total: number
        }
        Insert: {
          custo_unitario?: number
          id?: string
          inventory_item_id: string
          purchase_id: string
          quantidade: number
          total?: number
        }
        Update: {
          custo_unitario?: number
          id?: string
          inventory_item_id?: string
          purchase_id?: string
          quantidade?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_balance"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          confirmada_em: string | null
          created_at: string
          created_by: string | null
          id: string
          observacao: string | null
          status: string
          supplier_id: string | null
          total: number
          unit_id: string | null
        }
        Insert: {
          confirmada_em?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          observacao?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          unit_id?: string | null
        }
        Update: {
          confirmada_em?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          observacao?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      receivables: {
        Row: {
          account_id: string | null
          company_id: string | null
          company_invoice_id: string | null
          created_at: string
          descricao: string
          id: string
          pago_em: string | null
          recebido_por: string | null
          status: string
          unit_id: string | null
          valor: number
          vencimento: string | null
        }
        Insert: {
          account_id?: string | null
          company_id?: string | null
          company_invoice_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          pago_em?: string | null
          recebido_por?: string | null
          status?: string
          unit_id?: string | null
          valor: number
          vencimento?: string | null
        }
        Update: {
          account_id?: string | null
          company_id?: string | null
          company_invoice_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          pago_em?: string | null
          recebido_por?: string | null
          status?: string
          unit_id?: string | null
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receivables_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_company_invoice_id_fkey"
            columns: ["company_invoice_id"]
            isOneToOne: false
            referencedRelation: "company_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          id: string
          inventory_item_id: string
          quantidade: number
          version_id: string
        }
        Insert: {
          id?: string
          inventory_item_id: string
          quantidade?: number
          version_id: string
        }
        Update: {
          id?: string
          inventory_item_id?: string
          quantidade?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_balance"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "recipe_items_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "recipe_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "v_recipe_cost"
            referencedColumns: ["version_id"]
          },
        ]
      }
      recipe_versions: {
        Row: {
          ativa: boolean
          created_at: string
          created_by: string | null
          id: string
          observacao: string | null
          recipe_id: string
          rendimento: number
          versao: number
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          observacao?: string | null
          recipe_id: string
          rendimento?: number
          versao?: number
        }
        Update: {
          ativa?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          observacao?: string | null
          recipe_id?: string
          rendimento?: number
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_versions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          nome: string
          produto_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          produto_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          descricao: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      stock_count_items: {
        Row: {
          count_id: string
          diferenca: number | null
          id: string
          item_id: string
          qtd_contada: number | null
          qtd_sistema: number
        }
        Insert: {
          count_id: string
          diferenca?: number | null
          id?: string
          item_id: string
          qtd_contada?: number | null
          qtd_sistema?: number
        }
        Update: {
          count_id?: string
          diferenca?: number | null
          id?: string
          item_id?: string
          qtd_contada?: number | null
          qtd_sistema?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "stock_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_balance"
            referencedColumns: ["item_id"]
          },
        ]
      }
      stock_counts: {
        Row: {
          created_at: string
          created_by: string | null
          fechada_em: string | null
          id: string
          observacao: string | null
          status: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fechada_em?: string | null
          id?: string
          observacao?: string | null
          status?: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fechada_em?: string | null
          id?: string
          observacao?: string | null
          status?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          count_id: string | null
          created_at: string
          created_by: string | null
          custo_unitario: number | null
          id: string
          item_id: string
          motivo: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          count_id?: string | null
          created_at?: string
          created_by?: string | null
          custo_unitario?: number | null
          id?: string
          item_id: string
          motivo?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          count_id?: string | null
          created_at?: string
          created_by?: string | null
          custo_unitario?: number | null
          id?: string
          item_id?: string
          motivo?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_balance"
            referencedColumns: ["item_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato: string | null
          created_at: string
          id: string
          nome: string
          unit_id: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          nome: string
          unit_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          nome?: string
          unit_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          ativa: boolean
          created_at: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role_id: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_inventory_balance: {
        Row: {
          item_id: string | null
          saldo: number | null
        }
        Relationships: []
      }
      v_recipe_cost: {
        Row: {
          custo_porcao: number | null
          recipe_id: string | null
          version_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_versions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      baixar_estoque_pedido: { Args: { p_pedido_id: string; p_user?: string }; Returns: Json }
      current_user_role_slugs: { Args: never; Returns: string[] }
      email_por_nome_login: { Args: { p_nome: string }; Returns: string }
      is_gestor: { Args: never; Returns: boolean }
      listar_colaboradores_login: {
        Args: never
        Returns: {
          nome: string
        }[]
      }
      user_has_permission: { Args: { perm: string }; Returns: boolean }
    }
    Enums: {
      motivo_saida_indicacao_enum:
        | "recusou"
        | "sem_resposta"
        | "convertido"
        | "invalido"
      sessao_status_enum:
        | "aguardando"
        | "em_atendimento"
        | "finalizado"
        | "pausado"
      status_cadencia_enum: "ativo" | "pausado" | "inativo" | "bloqueado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      motivo_saida_indicacao_enum: [
        "recusou",
        "sem_resposta",
        "convertido",
        "invalido",
      ],
      sessao_status_enum: [
        "aguardando",
        "em_atendimento",
        "finalizado",
        "pausado",
      ],
      status_cadencia_enum: ["ativo", "pausado", "inativo", "bloqueado"],
    },
  },
} as const
