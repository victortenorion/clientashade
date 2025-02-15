
export interface NFSe {
  id: string;
  numero_nfse: number;
  client_id: string;
  data_emissao: string;
  status_sefaz: string;
  valor_servicos: number;
  valor_iss: number | null;
  aliquota_iss: number | null;
  codigo_servico: string;
  discriminacao_servicos: string;
  ambiente: 'homologacao' | 'producao';
  numero_rps: string | null;
  serie_rps: string | null;
  data_competencia: string;
  base_calculo: number | null;
  deducoes: number;
  valor_total: number | null;
  observacoes: string | null;
  cancelada: boolean;
  motivo_cancelamento: string | null;
  xml_envio: string | null;
  xml_retorno: string | null;
  created_at: string;
  updated_at: string;
  natureza_operacao: string;
  municipio_prestacao: string;
  cnae: string;
  retencao_ir: boolean;
  valor_ir: number;
  percentual_ir: number;
  retencao_iss: boolean;
  desconto_iss: boolean;
  retencao_inss: boolean;
  valor_inss: number;
  retencao_pis_cofins_csll: boolean;
  percentual_tributos_ibpt: number;
  valor_tributos_ibpt: number;
  desconto_incondicional: number;
  vendedor_id: string | null;
  comissao_percentual: number;
  valor_comissao: number;
  codigo_verificacao: string | null;
  inscricao_prestador: string | null;
  clients?: {
    name: string;
    document: string;
    email?: string;
    street?: string;
    street_number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
}

export interface NFSeEvento {
  id: string;
  nfse_id: string;
  tipo_evento: string;
  data_evento: string;
  descricao: string | null;
  status: string | null;
  mensagem_sefaz: string | null;
  created_at: string;
  updated_at: string;
}

export interface NFSeConfig {
  id: string;
  certificado_digital: string | null;
  senha_certificado: string | null;
  ambiente: 'homologacao' | 'producao';
  ultima_nfse_numero: number;
  codigo_municipio: string | null;
  inscricao_municipal: string | null;
  regime_tributario: string | null;
  regime_especial: string | null;
  incentivo_fiscal: boolean;
  created_at: string;
  updated_at: string;
}

export interface NFSeSPSettings {
  id: string;
  inscricao_municipal: string | null;
  codigo_regime_tributario: string;
  tipo_documento: string;
  lote_rps_numero: number;
  versao_schema: string;
  created_at: string;
  updated_at: string;
  tipo_regime_especial: string | null;
  operacao_tributacao: string;
  cpf_responsavel: string | null;
  producao_intermediario: boolean;
  iss_retido_intermediario: boolean;
  intermediario_cnpj: string | null;
  intermediario_inscricao_municipal: string | null;
  intermediario_email: string | null;
  servico_codigo_item_lista: string | null;
  servico_discriminacao_item: string | null;
  servico_valor_item: number;
  servico_valor_deducao: number;
  servico_valor_base_calculo: number;
  servico_percentual_reducao_base_calculo: number;
  proxy_port_ssl: string | null;
  proxy_host_ssl: string | null;
  wsdl_producao_url: string;
  wsdl_homologacao_url: string;
}

export interface RPSResponse {
  ultima_rps_numero: number;
  serie_rps_padrao: string;
  tipo_rps: string;
  ambiente: string;
}

export interface NFSeServico {
  id: string;
  codigo: string;
  descricao: string;
  aliquota_iss: number | null;
  created_at: string;
  updated_at: string;
}

export interface NFSeFormData {
  client_id: string;
  codigo_servico: string;
  discriminacao_servicos: string;
  valor_servicos: number;
  data_competencia: string;
  observacoes?: string;
  deducoes?: number;
  natureza_operacao?: string;
  municipio_prestacao?: string;
  cnae?: string;
  retencao_ir?: boolean;
  percentual_ir?: number;
  retencao_iss?: boolean;
  desconto_iss?: boolean;
  retencao_inss?: boolean;
  retencao_pis_cofins_csll?: boolean;
  percentual_tributos_ibpt?: number;
  desconto_incondicional?: number;
  vendedor_id?: string;
  comissao_percentual?: number;
  numero_rps?: string;
  serie_rps?: string;
  responsavel_retencao?: string;
  local_servico?: string;
  codigo_atividade?: string;
  codigo_tributacao_municipio?: string;
  optante_mei?: boolean;
  prestador_incentivador_cultural?: boolean;
  tributacao_rps?: string;
  enviar_email_tomador?: boolean;
  enviar_email_intermediario?: boolean;
  intermediario_servico?: boolean;
  aliquota_pis?: number;
  aliquota_cofins?: number;
  aliquota_csll?: number;
  outras_retencoes?: number;
  tipo_servico?: string;
  codigo_regime_especial_tributacao?: string;
}

export interface NFSeCancelamento {
  motivo: string;
  senha_certificado?: string;
}
