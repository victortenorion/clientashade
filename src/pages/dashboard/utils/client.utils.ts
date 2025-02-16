
export const getLastFourDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
};

export const formatDocument = (doc: string) => {
  const cleanDoc = doc.replace(/\D/g, '');
  if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
};

export const getFieldLabel = (fieldName: string) => {
  const labels: { [key: string]: string } = {
    name: "Nome",
    email: "Email",
    phone: "Telefone",
    document: "Documento",
    fantasy_name: "Nome Fantasia",
    state_registration: "Inscrição Estadual",
    municipal_registration: "Inscrição Municipal",
    zip_code: "CEP",
    state: "Estado",
    city: "Cidade",
    neighborhood: "Bairro",
    street: "Logradouro",
    street_number: "Número",
    complement: "Complemento",
    phone_landline: "Telefone Fixo",
    fax: "Fax",
    mobile_phone: "Celular",
    phone_carrier: "Operadora",
    website: "Website",
    nfe_email: "Email NFe",
    client_login: "Login do Cliente",
    // Labels para campos NFS-e SP
    tipo_documento_prestador: "Tipo Documento Prestador",
    tipo_documento_tomador: "Tipo Documento Tomador",
    inscricao_estadual_tomador: "Inscrição Estadual Tomador",
    inscricao_municipal_tomador: "Inscrição Municipal Tomador",
    tipo_endereco_tomador: "Tipo Endereço Tomador",
    inscricao_suframa: "Inscrição SUFRAMA",
    codigo_pais_tomador: "Código País Tomador",
    codigo_municipio_tomador: "Código Município Tomador",
    tipo_tomador: "Tipo Tomador",
    regime_especial_tributacao: "Regime Especial Tributação",
    indicador_incentivo_fiscal: "Indicador Incentivo Fiscal"
  };
  return labels[fieldName] || fieldName;
};

export interface ClientFormData {
  name: string;
  fantasy_name: string;
  email: string;
  phone: string;
  document: string;
  client_login: string;
  client_password: string;
  person_type: 'PF' | 'PJ';
  state_registration: string;
  state_registration_exempt: boolean;
  municipal_registration: string;
  zip_code: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  street_number: string;
  complement: string;
  contact_info: string;
  contact_persons: { name: string; role: string; phone: string; email: string; }[];
  phone_landline: string;
  fax: string;
  mobile_phone: string;
  phone_carrier: string;
  website: string;
  nfe_email: string;
  store_id: string;
  // Campos NFS-e SP
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

export const defaultFormData: ClientFormData = {
  name: "",
  fantasy_name: "",
  email: "",
  phone: "",
  document: "",
  client_login: "",
  client_password: "",
  person_type: 'PF',
  state_registration: "",
  state_registration_exempt: false,
  municipal_registration: "",
  zip_code: "",
  state: "",
  city: "",
  neighborhood: "",
  street: "",
  street_number: "",
  complement: "",
  contact_info: "",
  contact_persons: [],
  phone_landline: "",
  fax: "",
  mobile_phone: "",
  phone_carrier: "",
  website: "",
  nfe_email: "",
  store_id: "",
  // Valores padrão para campos NFS-e SP
  tipo_documento_prestador: "CNPJ",
  tipo_documento_tomador: "CNPJ",
  inscricao_estadual_tomador: "",
  inscricao_municipal_tomador: "",
  tipo_endereco_tomador: "R",
  inscricao_suframa: "",
  codigo_pais_tomador: "1058", // Código do Brasil
  codigo_municipio_tomador: "",
  tipo_tomador: "J",
  regime_especial_tributacao: "",
  indicador_incentivo_fiscal: false
};
