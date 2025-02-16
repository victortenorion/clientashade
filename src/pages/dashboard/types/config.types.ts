
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
  // Campos específicos SP
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
  // Novos campos importantes
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
