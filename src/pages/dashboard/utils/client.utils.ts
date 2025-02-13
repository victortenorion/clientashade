
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
    client_login: "Login do Cliente"
  };
  return labels[fieldName] || fieldName;
};

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
};
