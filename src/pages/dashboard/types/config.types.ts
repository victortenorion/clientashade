
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
  numero_inicial_nfse?: number; // Changed from string to number
  aliquota_servico: number;
  versao_schema: string;
  lote_rps_numero: number;
  operacao_tributacao: string;
  codigo_regime_tributario: string;
  tipo_regime_especial: string;
  codigo_cidade_prestacao: string;
  usuario_emissor: string;
  senha_emissor: string;
  lote_envio_maximo: number;
  url_provedor: string;
  proxy_host?: string;
  proxy_porta?: string;
  proxy_usuario?: string;
  proxy_senha?: string;
  numero_lote: number;
  usar_certificado_gov: boolean;
  caminho_certificado_gov?: string;
  senha_certificado_gov?: string;
  rps_tipo: string;
  rps_serie: string;
  tipo_contribuinte: string;
  gerar_prazos_aceite: boolean;
  prazo_aceite_dias: number;
  tipo_documento_prestador: string;
  enviar_email_tomador: boolean;
  alerta_envio_email: boolean;
  substituir_nfse: boolean;
  substituida_numero?: string;
  substituida_serie?: string;
  usar_tributacao_aproximada: boolean;
  percentual_tributos_aproximado: number;
  local_servico: string;
  tipo_documento_tomador: string;
  padrao_prefeitura: string;
  gerar_guia_pagamento: boolean;
  codigo_servico_municipio: string;
  fonte_tributos: string;
  natureza_operacao: string;
  descricao_servico_padrao: string;
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

export interface NFSeServiceCode {
  id: string;
  code: string;
  description: string;
  aliquota_iss?: number;
}

export interface CompanySettings {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_municipal: string;
  inscricao_estadual: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    codigo_municipio: string;
  };
  regime_tributario: string;
  cnae: string;
  codigo_servico: string;
}

export interface RPSSettings {
  serie: string;
  tipo: string;
  numero_inicial: number;
  lote_atual: number;
}

export interface NFSePaulista {
  tipo_rnps: string;
  operacao: string;
  tributacao_rps: string;
  status_rps: string;
  valor_servicos: number;
  valor_deducoes: number;
  valor_pis: number;
  valor_cofins: number;
  valor_inss: number;
  valor_ir: number;
  valor_csll: number;
  codigo_atividade: string;
  aliquota_servicos: number;
  tipo_recolhimento: string;
  codigo_municipio_prestacao?: string;
  cidade_prestacao?: string;
  discriminacao_servicos: string;
  iss_retido: boolean;
  responsavel_retencao?: string;
  item_lista_servico?: string;
  codigo_tributacao_municipio?: string;
  discriminacao?: string;
  cnae_fiscal?: string;
  descricao_regime_especial?: string;
  natureza_operacao?: string;
  optante_simples_nacional?: boolean;
  incentivador_cultural?: boolean;
  producao_cultural?: boolean;
  situacao_tributaria?: string;
  valor_outras_deducoes?: number;
  valor_desconto_incondicionado?: number;
  valor_desconto_condicionado?: number;
  valor_outras_retencoes?: number;
  outras_observacoes?: string;
}
