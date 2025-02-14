
export interface Status {
  id: string;
  name: string;
  color: string;
  description: string;
  is_active: boolean;
}

export interface ClientField {
  id: string;
  field: string;
  label: string;
  visible: boolean;
  field_name: string;
}

export interface CustomerAreaField {
  id: string;
  field: string;
  label: string;
  visible: boolean;
  field_name: string;
}

export interface FiscalConfig {
  service_code: string;
  cnae: string;
  tax_regime: string;
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

export interface ServiceCode {
  code: string;
  description: string;
}
