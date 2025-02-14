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
      client_field_settings: {
        Row: {
          created_at: string
          field_name: string
          id: string
          updated_at: string
          visible: boolean | null
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          updated_at?: string
          visible?: boolean | null
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          updated_at?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      client_registration_field_settings: {
        Row: {
          created_at: string
          field_name: string
          id: string
          updated_at: string
          visible: boolean | null
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          updated_at?: string
          visible?: boolean | null
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          updated_at?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          city: string | null
          client_login: string | null
          client_password: string | null
          codigo_servico: string | null
          complement: string | null
          contact_info: string | null
          contact_persons: Json | null
          created_at: string
          document: string | null
          email: string | null
          fantasy_name: string | null
          fax: string | null
          id: string
          mobile_phone: string | null
          municipal_registration: string | null
          name: string
          neighborhood: string | null
          nfe_email: string | null
          person_type: string | null
          phone: string | null
          phone_carrier: string | null
          phone_landline: string | null
          state: string | null
          state_registration: string | null
          state_registration_exempt: boolean | null
          store_id: string | null
          street: string | null
          street_number: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          client_login?: string | null
          client_password?: string | null
          codigo_servico?: string | null
          complement?: string | null
          contact_info?: string | null
          contact_persons?: Json | null
          created_at?: string
          document?: string | null
          email?: string | null
          fantasy_name?: string | null
          fax?: string | null
          id?: string
          mobile_phone?: string | null
          municipal_registration?: string | null
          name: string
          neighborhood?: string | null
          nfe_email?: string | null
          person_type?: string | null
          phone?: string | null
          phone_carrier?: string | null
          phone_landline?: string | null
          state?: string | null
          state_registration?: string | null
          state_registration_exempt?: boolean | null
          store_id?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          client_login?: string | null
          client_password?: string | null
          codigo_servico?: string | null
          complement?: string | null
          contact_info?: string | null
          contact_persons?: Json | null
          created_at?: string
          document?: string | null
          email?: string | null
          fantasy_name?: string | null
          fax?: string | null
          id?: string
          mobile_phone?: string | null
          municipal_registration?: string | null
          name?: string
          neighborhood?: string | null
          nfe_email?: string | null
          person_type?: string | null
          phone?: string | null
          phone_carrier?: string | null
          phone_landline?: string | null
          state?: string | null
          state_registration?: string | null
          state_registration_exempt?: boolean | null
          store_id?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      company_info: {
        Row: {
          cnae: string | null
          cnpj: string
          codigo_servico: string | null
          created_at: string
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_codigo_municipio: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome_fantasia: string | null
          razao_social: string
          regime_tributario: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnae?: string | null
          cnpj: string
          codigo_servico?: string | null
          created_at?: string
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_codigo_municipio?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          razao_social: string
          regime_tributario?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnae?: string | null
          cnpj?: string
          codigo_servico?: string | null
          created_at?: string
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_codigo_municipio?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          regime_tributario?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_area_field_settings: {
        Row: {
          created_at: string
          field_name: string
          id: string
          updated_at: string
          visible: boolean | null
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          updated_at?: string
          visible?: boolean | null
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          updated_at?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      customer_area_settings: {
        Row: {
          allow_create_orders: boolean | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          store_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_create_orders?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          store_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          allow_create_orders?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          store_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_area_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_config: {
        Row: {
          config: Json
          created_at: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lc116_service_codes: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      nfce: {
        Row: {
          ambiente: string | null
          cancelada: boolean | null
          chave_acesso: string | null
          client_id: string | null
          created_at: string | null
          danfe_url: string | null
          data_cancelamento: string | null
          data_emissao: string | null
          data_saida: string | null
          forma_pagamento: string | null
          id: string
          motivo_cancelamento: string | null
          numero_nfce: number
          protocolo_autorizacao: string | null
          serie: number | null
          service_order_id: string | null
          status_sefaz: string | null
          updated_at: string | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_outras_despesas: number | null
          valor_produtos: number
          valor_seguro: number | null
          valor_total: number | null
          xml_envio: string | null
          xml_retorno: string | null
        }
        Insert: {
          ambiente?: string | null
          cancelada?: boolean | null
          chave_acesso?: string | null
          client_id?: string | null
          created_at?: string | null
          danfe_url?: string | null
          data_cancelamento?: string | null
          data_emissao?: string | null
          data_saida?: string | null
          forma_pagamento?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero_nfce?: number
          protocolo_autorizacao?: string | null
          serie?: number | null
          service_order_id?: string | null
          status_sefaz?: string | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_outras_despesas?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number | null
          xml_envio?: string | null
          xml_retorno?: string | null
        }
        Update: {
          ambiente?: string | null
          cancelada?: boolean | null
          chave_acesso?: string | null
          client_id?: string | null
          created_at?: string | null
          danfe_url?: string | null
          data_cancelamento?: string | null
          data_emissao?: string | null
          data_saida?: string | null
          forma_pagamento?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero_nfce?: number
          protocolo_autorizacao?: string | null
          serie?: number | null
          service_order_id?: string | null
          status_sefaz?: string | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_outras_despesas?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number | null
          xml_envio?: string | null
          xml_retorno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfce_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce_config: {
        Row: {
          ambiente: string | null
          certificado_digital: string | null
          certificado_validade: string | null
          certificado_valido: boolean | null
          created_at: string | null
          csc_id: string | null
          csc_token: string | null
          id: string
          inscricao_estadual: string | null
          regime_tributario: string | null
          senha_certificado: string | null
          token_ibpt: string | null
          ultima_nfce_numero: number | null
          updated_at: string | null
        }
        Insert: {
          ambiente?: string | null
          certificado_digital?: string | null
          certificado_validade?: string | null
          certificado_valido?: boolean | null
          created_at?: string | null
          csc_id?: string | null
          csc_token?: string | null
          id?: string
          inscricao_estadual?: string | null
          regime_tributario?: string | null
          senha_certificado?: string | null
          token_ibpt?: string | null
          ultima_nfce_numero?: number | null
          updated_at?: string | null
        }
        Update: {
          ambiente?: string | null
          certificado_digital?: string | null
          certificado_validade?: string | null
          certificado_valido?: boolean | null
          created_at?: string | null
          csc_id?: string | null
          csc_token?: string | null
          id?: string
          inscricao_estadual?: string | null
          regime_tributario?: string | null
          senha_certificado?: string | null
          token_ibpt?: string | null
          ultima_nfce_numero?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nfce_eventos: {
        Row: {
          created_at: string | null
          data_evento: string | null
          descricao: string | null
          id: string
          mensagem_sefaz: string | null
          nfce_id: string | null
          status: string | null
          tipo_evento: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_evento?: string | null
          descricao?: string | null
          id?: string
          mensagem_sefaz?: string | null
          nfce_id?: string | null
          status?: string | null
          tipo_evento: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string | null
          descricao?: string | null
          id?: string
          mensagem_sefaz?: string | null
          nfce_id?: string | null
          status?: string | null
          tipo_evento?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfce_eventos_nfce_id_fkey"
            columns: ["nfce_id"]
            isOneToOne: false
            referencedRelation: "nfce"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce_items: {
        Row: {
          cfop: string | null
          created_at: string | null
          id: string
          ncm: string | null
          nfce_id: string | null
          product_id: string | null
          quantidade: number
          unidade: string | null
          updated_at: string | null
          valor_desconto: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          cfop?: string | null
          created_at?: string | null
          id?: string
          ncm?: string | null
          nfce_id?: string | null
          product_id?: string | null
          quantidade: number
          unidade?: string | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          cfop?: string | null
          created_at?: string | null
          id?: string
          ncm?: string | null
          nfce_id?: string | null
          product_id?: string | null
          quantidade?: number
          unidade?: string | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfce_items_nfce_id_fkey"
            columns: ["nfce_id"]
            isOneToOne: false
            referencedRelation: "nfce"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse: {
        Row: {
          aliquota_iss: number | null
          ambiente: string | null
          base_calculo: number | null
          cancelada: boolean | null
          client_id: string
          cnae: string | null
          codigo_servico: string
          comissao_percentual: number | null
          created_at: string | null
          data_cancelamento: string | null
          data_competencia: string
          data_emissao: string | null
          deducoes: number | null
          desconto_incondicional: number | null
          desconto_iss: boolean | null
          discriminacao_servicos: string
          id: string
          motivo_cancelamento: string | null
          municipio_prestacao: string | null
          natureza_operacao: string | null
          numero_nfse: number
          numero_rps: string | null
          observacoes: string | null
          percentual_ir: number | null
          percentual_tributos_ibpt: number | null
          retencao_inss: boolean | null
          retencao_ir: boolean | null
          retencao_iss: boolean | null
          retencao_pis_cofins_csll: boolean | null
          serie_rps: string | null
          service_order_id: string | null
          status_sefaz: string | null
          updated_at: string | null
          valor_comissao: number | null
          valor_inss: number | null
          valor_ir: number | null
          valor_iss: number | null
          valor_servicos: number
          valor_total: number | null
          valor_tributos_ibpt: number | null
          vendedor_id: string | null
          xml_envio: string | null
          xml_retorno: string | null
        }
        Insert: {
          aliquota_iss?: number | null
          ambiente?: string | null
          base_calculo?: number | null
          cancelada?: boolean | null
          client_id: string
          cnae?: string | null
          codigo_servico: string
          comissao_percentual?: number | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_competencia: string
          data_emissao?: string | null
          deducoes?: number | null
          desconto_incondicional?: number | null
          desconto_iss?: boolean | null
          discriminacao_servicos: string
          id?: string
          motivo_cancelamento?: string | null
          municipio_prestacao?: string | null
          natureza_operacao?: string | null
          numero_nfse?: number
          numero_rps?: string | null
          observacoes?: string | null
          percentual_ir?: number | null
          percentual_tributos_ibpt?: number | null
          retencao_inss?: boolean | null
          retencao_ir?: boolean | null
          retencao_iss?: boolean | null
          retencao_pis_cofins_csll?: boolean | null
          serie_rps?: string | null
          service_order_id?: string | null
          status_sefaz?: string | null
          updated_at?: string | null
          valor_comissao?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_servicos: number
          valor_total?: number | null
          valor_tributos_ibpt?: number | null
          vendedor_id?: string | null
          xml_envio?: string | null
          xml_retorno?: string | null
        }
        Update: {
          aliquota_iss?: number | null
          ambiente?: string | null
          base_calculo?: number | null
          cancelada?: boolean | null
          client_id?: string
          cnae?: string | null
          codigo_servico?: string
          comissao_percentual?: number | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_competencia?: string
          data_emissao?: string | null
          deducoes?: number | null
          desconto_incondicional?: number | null
          desconto_iss?: boolean | null
          discriminacao_servicos?: string
          id?: string
          motivo_cancelamento?: string | null
          municipio_prestacao?: string | null
          natureza_operacao?: string | null
          numero_nfse?: number
          numero_rps?: string | null
          observacoes?: string | null
          percentual_ir?: number | null
          percentual_tributos_ibpt?: number | null
          retencao_inss?: boolean | null
          retencao_ir?: boolean | null
          retencao_iss?: boolean | null
          retencao_pis_cofins_csll?: boolean | null
          serie_rps?: string | null
          service_order_id?: string | null
          status_sefaz?: string | null
          updated_at?: string | null
          valor_comissao?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_servicos?: number
          valor_total?: number | null
          valor_tributos_ibpt?: number | null
          vendedor_id?: string | null
          xml_envio?: string | null
          xml_retorno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfse_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfse_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse_config: {
        Row: {
          ambiente: string | null
          certificado_digital: string | null
          certificado_validade: string | null
          certificado_valido: boolean | null
          codigo_municipio: string | null
          created_at: string | null
          id: string
          incentivo_fiscal: boolean | null
          inscricao_municipal: string | null
          permite_emissao_sem_certificado: boolean | null
          regime_especial: string | null
          regime_tributario: string | null
          senha_certificado: string | null
          ultima_nfse_numero: number | null
          updated_at: string | null
        }
        Insert: {
          ambiente?: string | null
          certificado_digital?: string | null
          certificado_validade?: string | null
          certificado_valido?: boolean | null
          codigo_municipio?: string | null
          created_at?: string | null
          id?: string
          incentivo_fiscal?: boolean | null
          inscricao_municipal?: string | null
          permite_emissao_sem_certificado?: boolean | null
          regime_especial?: string | null
          regime_tributario?: string | null
          senha_certificado?: string | null
          ultima_nfse_numero?: number | null
          updated_at?: string | null
        }
        Update: {
          ambiente?: string | null
          certificado_digital?: string | null
          certificado_validade?: string | null
          certificado_valido?: boolean | null
          codigo_municipio?: string | null
          created_at?: string | null
          id?: string
          incentivo_fiscal?: boolean | null
          inscricao_municipal?: string | null
          permite_emissao_sem_certificado?: boolean | null
          regime_especial?: string | null
          regime_tributario?: string | null
          senha_certificado?: string | null
          ultima_nfse_numero?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nfse_eventos: {
        Row: {
          created_at: string | null
          data_evento: string | null
          descricao: string | null
          id: string
          mensagem_sefaz: string | null
          nfse_id: string
          status: string | null
          tipo_evento: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_evento?: string | null
          descricao?: string | null
          id?: string
          mensagem_sefaz?: string | null
          nfse_id: string
          status?: string | null
          tipo_evento: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string | null
          descricao?: string | null
          id?: string
          mensagem_sefaz?: string | null
          nfse_id?: string
          status?: string | null
          tipo_evento?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfse_eventos_nfse_id_fkey"
            columns: ["nfse_id"]
            isOneToOne: false
            referencedRelation: "nfse"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse_sefaz_logs: {
        Row: {
          created_at: string
          id: string
          message: string | null
          nfse_id: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          nfse_id: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          nfse_id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfse_sefaz_logs_nfse_id_fkey"
            columns: ["nfse_id"]
            isOneToOne: false
            referencedRelation: "nfse"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse_servicos: {
        Row: {
          aliquota_iss: number | null
          codigo: string
          created_at: string | null
          descricao: string
          id: string
          updated_at: string | null
        }
        Insert: {
          aliquota_iss?: number | null
          codigo: string
          created_at?: string | null
          descricao: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          aliquota_iss?: number | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      sefaz_transmission_queue: {
        Row: {
          created_at: string | null
          documento_id: string
          erro_mensagem: string | null
          id: string
          status: string
          tentativas: number | null
          tipo: string
          ultima_tentativa: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          documento_id: string
          erro_mensagem?: string | null
          id?: string
          status?: string
          tentativas?: number | null
          tipo: string
          ultima_tentativa?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          documento_id?: string
          erro_mensagem?: string | null
          id?: string
          status?: string
          tentativas?: number | null
          tipo?: string
          ultima_tentativa?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          price: number
          service_order_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          price?: number
          service_order_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          price?: number
          service_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_items_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_statuses: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          client_id: string
          completion_date: string | null
          created_at: string
          created_by_type: string
          description: string
          equipment: string | null
          equipment_serial_number: string | null
          exit_date: string | null
          expected_date: string | null
          id: string
          internal_notes: string | null
          invoice_key: string | null
          invoice_number: string | null
          order_number: number
          priority: string | null
          problem: string | null
          reception_notes: string | null
          seller_id: string | null
          shipping_company: string | null
          status_id: string | null
          store_id: string | null
          total_price: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          completion_date?: string | null
          created_at?: string
          created_by_type?: string
          description: string
          equipment?: string | null
          equipment_serial_number?: string | null
          exit_date?: string | null
          expected_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_key?: string | null
          invoice_number?: string | null
          order_number?: number
          priority?: string | null
          problem?: string | null
          reception_notes?: string | null
          seller_id?: string | null
          shipping_company?: string | null
          status_id?: string | null
          store_id?: string | null
          total_price?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          completion_date?: string | null
          created_at?: string
          created_by_type?: string
          description?: string
          equipment?: string | null
          equipment_serial_number?: string | null
          exit_date?: string | null
          expected_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_key?: string | null
          invoice_number?: string | null
          order_number?: number
          priority?: string | null
          problem?: string | null
          reception_notes?: string | null
          seller_id?: string | null
          shipping_company?: string | null
          status_id?: string | null
          store_id?: string | null
          total_price?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_order_status"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "service_order_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "service_order_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tax_codes: {
        Row: {
          aliquota_iss: number | null
          cnae: string | null
          codigo: string
          created_at: string | null
          descricao: string
          id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          aliquota_iss?: number | null
          cnae?: string | null
          codigo: string
          created_at?: string | null
          descricao: string
          id?: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          aliquota_iss?: number | null
          cnae?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          menu_permission: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_permission: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_permission?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stores: {
        Row: {
          created_at: string
          id: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_client_credentials: {
        Args: {
          p_login: string
          p_password: string
        }
        Returns: string
      }
      user_has_all_permissions: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
