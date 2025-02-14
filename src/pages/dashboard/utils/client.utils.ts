export const getFieldLabel = (fieldName: string): string => {
  const labels: { [key: string]: string } = {
    name: 'Nome',
    document: 'Documento',
    email: 'Email',
    phone: 'Telefone',
    person_type: 'Tipo de Pessoa',
    fantasy_name: 'Nome Fantasia',
    state_registration: 'Inscrição Estadual',
    state_registration_exempt: 'IE Isento',
    municipal_registration: 'Inscrição Municipal',
    zip_code: 'CEP',
    state: 'Estado',
    city: 'Cidade',
    neighborhood: 'Bairro',
    street: 'Rua',
    street_number: 'Número',
    complement: 'Complemento',
    contact_info: 'Informações de Contato',
    contact_persons: 'Contatos',
    phone_landline: 'Telefone Fixo',
    fax: 'Fax',
    mobile_phone: 'Celular',
    phone_carrier: 'Operadora',
    website: 'Website',
    nfe_email: 'Email NFe'
  };
  return labels[fieldName] || fieldName;
};

export const formatFieldValue = (fieldName: string, value: any): string => {
  if (value === null || value === undefined) return '';
  
  switch (fieldName) {
    case 'state_registration_exempt':
      return value ? 'Sim' : 'Não';
    case 'contact_persons':
      if (Array.isArray(value)) {
        return value.map(person => person.name).join(', ');
      }
      return '';
    default:
      return String(value);
  }
};
