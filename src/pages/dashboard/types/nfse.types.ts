
// Tipos base para NFSe São Paulo
export interface NFSeFormData {
  codigo_servico: string;
  discriminacao_servicos: string;
  natureza_operacao: string;
  tipo_recolhimento: string;
  numero_rps: string;
}

export interface NFSeSPRPS {
  tipo: 'RPS';
  serie: string;
  numero: string;
  data_emissao: string;
  situacao: 'N' | 'C' | 'E';
  serie_prestacao: string;
}

export interface NFSeSPPrestador {
  inscricao_municipal: string;
  cpf_cnpj: string;
  razao_social: string;
  tipo_endereco: string;
  endereco: string;
  numero_endereco: string;
  complemento_endereco?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  email?: string;
}

export interface NFSeSPTomador {
  tipo_cpf_cnpj: '1' | '2' | '3';
  cpf_cnpj: string;
  inscricao_municipal?: string;
  razao_social: string;
  tipo_endereco: string;
  endereco: string;
  numero_endereco: string;
  complemento_endereco?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  email?: string;
}

export interface NFSeSPServico {
  valor_servicos: number;
  valor_deducoes?: number;
  valor_pis?: number;
  valor_cofins?: number;
  valor_inss?: number;
  valor_ir?: number;
  valor_csll?: number;
  codigo_servico: string;
  aliquota_servicos?: number;
  discriminacao: string;
  municipio_prestacao?: string;
  tributacao_rps: string;
  optante_simples: '1' | '2';
  issretido: 'true' | 'false';
}

export interface NFSeSPConfig {
  versao_schema: string;
  cnpj: string;
  inscricao_municipal: string;
  senha_web: string;
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
}

export interface NFSeSPLote {
  id: string;
  numero_lote: number;
  cnpj: string;
  inscricao_municipal: string;
  quantidade_rps: number;
  lista_rps: NFSeSPRPS[];
  transacao: boolean;
  valor_total_servicos: number;
  valor_total_deducoes?: number;
  status: 'pendente' | 'processando' | 'erro' | 'sucesso';
  protocolo?: string;
}

export interface NFSeSPErroValidacao {
  codigo: string;
  mensagem: string;
  correcao?: string;
}

// Tipos para respostas do web service
export interface NFSeSPRetornoEnvio {
  codigo_retorno: string;
  mensagem_retorno: string;
  numero_lote?: string;
  numero_nfse?: string;
  data_recebimento?: string;
  protocolo?: string;
  erros?: NFSeSPErroValidacao[];
}

export interface NFSeSPSettings {
  id: string;
  versao_schema: string;
  tipo_rps: string;
  serie_rps: string;
  numero_rps: number;
  data_emissao: string;
  situacao: string;
  serie_prestacao: string;
  inscricao_prestador: string;
  tipo_cpf_cnpj_prestador: string;
  cpf_cnpj_prestador: string;
  razao_social_prestador: string;
  tipo_endereco: string;
  endereco: string;
  numero_endereco: string;
  complemento_endereco?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  email?: string;
  optante_simples: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Enums úteis
export enum NFSeSPNaturezaOperacao {
  TRIBUTACAO_MUNICIPIO = '1',
  TRIBUTACAO_FORA_MUNICIPIO = '2',
  ISENCAO = '3',
  IMUNE = '4',
  EXIGIBILIDADE_SUSPENSA_DECISAO_JUDICIAL = '5',
  EXIGIBILIDADE_SUSPENSA_PROCEDIMENTO_ADMINISTRATIVO = '6'
}

export enum NFSeSPStatusRPS {
  NORMAL = 'N',
  CANCELADO = 'C',
  EXTRAVIADO = 'E'
}

export enum NFSeSPTipoRecolhimento {
  A_RECOLHER = 'A',
  RETIDO = 'R'
}

export enum NFSeSPTipoEndereco {
  COMERCIAL = 'C',
  RESIDENCIAL = 'R'
}

export enum NFSeSPAmbiente {
  PRODUCAO = 'PRODUCAO',
  HOMOLOGACAO = 'HOMOLOGACAO'
}

