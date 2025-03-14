
export interface NFCeConfig {
  certificado_digital: string;
  senha_certificado: string;
  ambiente: string;
  regime_tributario: string;
  inscricao_estadual: string;
  token_ibpt: string;
  csc_token: string;
  csc_id: string;
  certificado_valido: boolean;
  certificado_validade?: string;
}

export interface NFSeConfig {
  certificado_digital: string;
  senha_certificado: string;
  ambiente: string;
  regime_tributario: string;
  regime_especial: string;
  inscricao_municipal: string;
  codigo_municipio: string;
  incentivo_fiscal: boolean;
  certificado_valido: boolean;
  certificado_validade?: string;
  numero_inicial_rps: string;
  numero_inicial_nfse?: string;
  aliquota_servico: number;
  serie_rps_padrao: string;
  tipo_rps: string;
  padrao_prefeitura: string;
  url_homologacao: string;
  url_producao: string;
  lote_rps_numero: number;
  versao_schema: string;
  operacao_tributacao: string;
  codigo_regime_tributario: string;
  tipo_regime_especial: string;
  codigo_cidade_prestacao: string;
  usuario_emissor: string;
  senha_emissor: string;
  lote_envio_maximo: number;
  url_provedor: string;
}

export interface FiscalConfig {
  service_code: string;
  cnae: string;
  tax_regime: string;
}
