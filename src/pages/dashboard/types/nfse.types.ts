
export interface NFSe {
  id: string;
  numero_nfse: number;
  client_id: string;
  data_emissao: string;
  valor_servicos: number;
  valor_total: number | null;
  status_sefaz: string;
  cancelada: boolean;
  excluida: boolean;
  data_exclusao: string | null;
  motivo_exclusao: string | null;
  data_cancelamento: string | null;
  motivo_cancelamento: string | null;
  protocolo_cancelamento: string | null;
  codigo_verificacao?: string;
  inscricao_prestador?: string;
  discriminacao_servicos: string;
  data_competencia: string;
  codigo_servico: string;
  ambiente?: string;
  deducoes?: number;
  base_calculo?: number;
  aliquota_iss?: number;
  valor_iss?: number;
  observacoes?: string;
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
  status: string;
  descricao: string;
  data_evento: string;
}

export interface NFSeFormData {
  client_id: string;
  codigo_servico: string;
  discriminacao_servicos: string;
  valor_servicos: number;
  data_competencia: string;
  deducoes?: number;
  observacoes?: string;
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
  codigo_regime_especial_tributacao?: string | null;
}

export interface RPSResponse {
  ultima_rps_numero: number;
  serie_rps_padrao: string;
  tipo_rps: string;
}
