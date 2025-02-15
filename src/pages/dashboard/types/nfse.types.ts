
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
  clients?: {
    name: string;
    document: string;
  };
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
}

export interface RPSResponse {
  ultima_rps_numero: number;
  serie_rps_padrao: string;
  tipo_rps: string;
}
