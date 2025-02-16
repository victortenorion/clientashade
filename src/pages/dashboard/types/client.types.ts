export interface ContactPerson {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Store {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  inscricao_municipal?: string;
  tipo_documento?: string;
  documento?: string;
  regime_tributario?: string;
  codigo_servico_padrao?: string;
  cnae?: string;
  codigo_municipio?: string;
  iss_retido?: boolean;
  aliquota_iss?: number;
  incentivador_cultural?: boolean;
}

export interface ClientFormData {
  id?: string;
  name: string;
  fantasy_name: string;
  document: string;
  person_type: string;
  state_registration: string;
  state_registration_exempt: boolean;
  municipal_registration: string;
  store_id: string;
  zip_code: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  phone_landline: string;
  mobile_phone: string;
  phone_carrier: string;
  email: string;
  nfe_email: string;
  website: string;
  client_login: string;
  client_password: string;
  contact_persons: ContactPerson[];
  phone?: string;
  fax?: string;
  contact_info?: string;
  // Novos campos para NFS-e SP
  tipo_documento_prestador?: string;
  tipo_documento_tomador?: string;
  inscricao_estadual_tomador?: string;
  inscricao_municipal_tomador?: string;
  tipo_endereco_tomador?: string;
  inscricao_suframa?: string;
  codigo_pais_tomador?: string;
  codigo_municipio_tomador?: string;
  tipo_tomador?: string;
  regime_especial_tributacao?: string;
  indicador_incentivo_fiscal?: boolean;
}

export interface DeleteDialogState {
  isOpen: boolean;
  clientId: string | null;
  withOrders?: boolean;
  adminPassword?: string;
}

export interface Client {
  id: string;
  name: string;
  fantasy_name: string;
  document: string;
  person_type: string;
  state_registration: string;
  state_registration_exempt: boolean;
  municipal_registration: string;
  store_id: string;
  zip_code: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  phone_landline: string;
  mobile_phone: string;
  phone_carrier: string;
  email: string;
  nfe_email: string;
  website: string;
  client_login: string;
  client_password: string;
  contact_persons: ContactPerson[];
  created_at: string;
  updated_at: string;
  phone?: string;
  fax?: string;
  contact_info?: string;
  // Novos campos para NFS-e SP
  tipo_documento_prestador?: string;
  tipo_documento_tomador?: string;
  inscricao_estadual_tomador?: string;
  inscricao_municipal_tomador?: string;
  tipo_endereco_tomador?: string;
  inscricao_suframa?: string;
  codigo_pais_tomador?: string;
  codigo_municipio_tomador?: string;
  tipo_tomador?: string;
  regime_especial_tributacao?: string;
  indicador_incentivo_fiscal?: boolean;
}
