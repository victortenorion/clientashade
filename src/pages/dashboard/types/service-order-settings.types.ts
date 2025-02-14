
export interface Status {
  id: string;
  name: string;
  color: string;
  description: string;
  is_active: boolean;
  created_at?: string;
}

export interface SEFAZTabProps {
  nfceConfig: {
    certificado_digital: string;
    senha_certificado: string;
    ambiente: string;
    regime_tributario: string;
    inscricao_estadual: string;
    token_ibpt: string;
    csc_token: string;
    csc_id: string;
  };
  nfseConfig: {
    certificado_digital: string;
    senha_certificado: string;
    ambiente: string;
    regime_tributario: string;
    regime_especial: string;
    inscricao_municipal: string;
    codigo_municipio: string;
    incentivo_fiscal: boolean;
  };
  fiscalConfig: {
    service_code: string;
    cnae: string;
    tax_regime: string;
  };
  setNfceConfig: (config: any) => void;
  setNfseConfig: (config: any) => void;
  setFiscalConfig: (config: any) => void;
  handleSaveAllConfigs: () => void;
}

export interface ClientField {
  id: string;
  label: string;
  field: string;
  visible: boolean;
}

export interface ClientTabProps {
  clientFields: ClientField[];
  onFieldVisibilityChange: (fieldId: string, visible: boolean) => void;
}
