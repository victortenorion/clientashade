
export interface Status {
  id: string;
  name: string;
  color: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NFCeConfig {
  certificado_digital: string;
  senha_certificado: string;
  ambiente: string;
  regime_tributario: string;
  inscricao_estadual: string;
  token_ibpt: string;
  csc_token: string;
  csc_id: string;
  certificado_valido?: boolean;
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
  certificado_valido?: boolean;
  certificado_validade?: string;
}

export interface FiscalConfig {
  service_code: string;
  cnae: string;
  tax_regime: string;
}

export interface ServiceOrder {
  id: string;
  description: string;
  status_id: string;
  total_price: number;
  created_at: string;
  order_number: number;
  priority: string;
  equipment: string;
  equipment_serial_number: string;
  problem: string;
  expected_date: string;
  completion_date: string;
  exit_date: string;
  status: {
    name: string;
    color: string;
  };
}
