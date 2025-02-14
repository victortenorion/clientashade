
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
}

export interface DeleteDialogState {
  isOpen: boolean;
  clientId: string | null;
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
}
