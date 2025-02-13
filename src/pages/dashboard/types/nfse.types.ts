
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
