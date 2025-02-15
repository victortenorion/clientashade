export interface NFSe {
  id: string;
  tipo_registro?: string;
  numero_nfse: number;
  data_hora_nfe?: string;
  data_emissao: string;
  data_competencia: string;
  codigo_verificacao: string;
  tipo_rps: string;
  serie_rps: string;
  numero_rps: string;
  data_fato_gerador: string;
  inscricao_prestador: string;
  tipo_documento_prestador: string;
  documento_prestador: string;
  razao_social_prestador: string;
  tipo_endereco_prestador: string;
  endereco_prestador: string;
  numero_endereco_prestador: string;
  complemento_endereco_prestador: string;
  bairro_prestador: string;
  cidade_prestador: string;
  uf_prestador: string;
  cep_prestador: string;
  email_prestador: string;
  opcao_simples: string;
  situacao_nota: string;
  data_cancelamento?: string;
  numero_guia?: string;
  data_quitacao_guia?: string;
  valor_servicos: number;
  valor_deducoes: number;
  deducoes: number;
  codigo_servico: string;
  aliquota_iss: number;
  valor_iss: number;
  valor_credito: number;
  base_calculo: number;
  iss_retido: string;
  tipo_documento_tomador: string;
  documento_tomador: string;
  inscricao_municipal_tomador?: string;
  inscricao_estadual_tomador?: string;
  razao_social_tomador: string;
  tipo_endereco_tomador: string;
  endereco_tomador: string;
  numero_endereco_tomador: string;
  complemento_endereco_tomador: string;
  bairro_tomador: string;
  cidade_tomador: string;
  uf_tomador: string;
  cep_tomador: string;
  email_tomador: string;
  nfse_substituta?: string;
  iss_pago?: number;
  iss_a_pagar?: number;
  tipo_documento_intermediario?: string;
  documento_intermediario?: string;
  inscricao_municipal_intermediario?: string;
  razao_social_intermediario?: string;
  repasse_plano_saude?: number;
  valor_pis: number;
  valor_cofins: number;
  valor_inss: number;
  valor_ir: number;
  valor_csll: number;
  aliquota_pis: number;
  aliquota_cofins: number;
  aliquota_csll: number;
  valor_carga_tributaria: number;
  percentual_carga_tributaria: number;
  percentual_tributos_ibpt: number;
  fonte_carga_tributaria?: string;
  cei?: string;
  matricula_obra?: string;
  municipio_prestacao_codigo?: string;
  municipio_prestacao?: string;
  situacao_aceite?: string;
  encapsulamento?: string;
  valor_total_recebido?: number;
  tipo_consolidacao?: string;
  nfse_consolidada?: string;
  discriminacao_servicos: string;
  observacoes?: string;
  client_id: string;
  status_sefaz: string;
  status_transmissao: string;
  ambiente?: string;
  valor_total: number;
  excluida?: boolean;
  cancelada?: boolean;
  natureza_operacao: string;
  cnae?: string;
  retencao_ir: boolean;
  percentual_ir: number;
  retencao_iss: boolean;
  desconto_iss: boolean;
  retencao_inss: boolean;
  retencao_pis_cofins_csll: boolean;
  desconto_incondicional: number;
  vendedor_id?: string;
  comissao_percentual: number;
  outras_retencoes: number;
  optante_mei: boolean;
  responsavel_retencao: string;
  local_servico: string;
  clients?: {
    name: string;
    document: string;
    email: string;
    street: string;
    street_number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
}

export interface NFSeFormData {
  client_id: string;
  codigo_servico: string;
  discriminacao_servicos: string;
  valor_servicos: number;
  data_competencia: string;
  deducoes: number;
  valor_deducoes: number;
  tipo_registro: string;
  tipo_rps: string;
  tipo_documento_prestador: string;
  inscricao_prestador: string;
  documento_prestador: string;
  razao_social_prestador: string;
  tipo_endereco_prestador: string;
  endereco_prestador: string;
  numero_endereco_prestador: string;
  complemento_endereco_prestador: string;
  bairro_prestador: string;
  cidade_prestador: string;
  uf_prestador: string;
  cep_prestador: string;
  email_prestador: string;
  opcao_simples: string;
  tipo_documento_tomador: string;
  documento_tomador: string;
  inscricao_municipal_tomador: string;
  inscricao_estadual_tomador: string;
  razao_social_tomador: string;
  tipo_endereco_tomador: string;
  endereco_tomador: string;
  numero_endereco_tomador: string;
  complemento_endereco_tomador: string;
  bairro_tomador: string;
  cidade_tomador: string;
  uf_tomador: string;
  cep_tomador: string;
  email_tomador: string;
  tipo_documento_intermediario: string;
  documento_intermediario: string;
  inscricao_municipal_intermediario: string;
  razao_social_intermediario: string;
  repasse_plano_saude: number;
  valor_pis: number;
  valor_cofins: number;
  valor_inss: number;
  valor_ir: number;
  valor_csll: number;
  outras_retencoes: number;
  valor_carga_tributaria: number;
  percentual_carga_tributaria: number;
  percentual_tributos_ibpt: number;
  fonte_carga_tributaria: string;
  cei: string;
  matricula_obra: string;
  municipio_prestacao: string;
  municipio_prestacao_codigo: string;
  situacao_aceite: string;
  encapsulamento: string;
  valor_total_recebido: number;
  tipo_consolidacao: string;
  nfse_consolidada: string;
  natureza_operacao: string;
  cnae: string;
  retencao_ir: boolean;
  percentual_ir: number;
  retencao_iss: boolean;
  desconto_iss: boolean;
  retencao_inss: boolean;
  retencao_pis_cofins_csll: boolean;
  desconto_incondicional: number;
  vendedor_id: string;
  comissao_percentual: number;
  responsavel_retencao: string;
  local_servico: string;
  optante_mei: boolean;
  prestador_incentivador_cultural: boolean;
  tributacao_rps: string;
  enviar_email_tomador: boolean;
  enviar_email_intermediario: boolean;
  intermediario_servico: boolean;
  codigo_regime_especial_tributacao: string | null;
  observacoes: string;
  aliquota_pis: number;
  aliquota_cofins: number;
  aliquota_csll: number;
  aliquota_iss: number;
  valor_iss: number;
  iss_retido: string;
  numero_rps: string;
  serie_rps: string;
  valor_total?: number;
}

export interface RPSResponse {
  ultima_rps_numero: number;
  serie_rps_padrao: string;
  tipo_rps: string;
}

export interface NFSeEvento {
  id: string;
  nfse_id: string;
  tipo_evento: string;
  status: string;
  descricao: string;
  data_evento: string;
}
