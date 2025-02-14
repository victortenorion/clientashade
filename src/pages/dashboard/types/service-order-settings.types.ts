
export interface Status {
  id: string;
  name: string;
  color: string;
  description: string;
  is_active: boolean;
}

export interface ClientField {
  id: string;
  label: string;
  field: string;
  visible: boolean;
}

export interface FiscalConfig {
  id?: string;
  service_code: string;
  cnae: string;
  tax_regime: string;
}

export interface CustomerAreaField {
  id: string;
  label: string;
  field: string;
  visible: boolean;
}

export interface NFCeConfig {
  certificado_digital: string;
  senha_certificado: string;
  ambiente: string;
  token_ibpt: string;
  csc_id: string;
  csc_token: string;
  inscricao_estadual: string;
  regime_tributario: string;
}

export interface NFSeConfig {
  certificado_digital: string;
  senha_certificado: string;
  ambiente: string;
  inscricao_municipal: string;
  codigo_municipio: string;
  regime_tributario: string;
  regime_especial: string;
  incentivo_fiscal: boolean;
}
