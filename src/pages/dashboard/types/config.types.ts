
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
  numero_inicial_rps: number;
  aliquota_servico: number;
  versao_schema: string;
  lote_rps_numero: number;
  operacao_tributacao: string;
  codigo_regime_tributario: string;
  tipo_regime_especial: string;
}

export interface FiscalConfig {
  service_code: string;
  cnae: string;
  tax_regime: string;
}

export interface ValidateCertificateResponse {
  success: boolean;
  message: string;
  validade?: string;
  info?: {
    validoAte: string;
    validoDe: string;
    possuiChavePrivada: boolean;
    emissor: Array<{type: string, value: string}>;
    subject: Array<{type: string, value: string}>;
  };
}
