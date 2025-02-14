
export interface ContactPerson {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  street?: string;
  street_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_persons?: ContactPerson[];
  contact_info?: string;
  fantasy_name?: string;
  person_type?: string;
  state_registration?: string;
  municipal_registration?: string;
  state_registration_exempt?: boolean;
  website?: string;
  phone_landline?: string;
  phone_carrier?: string;
  mobile_phone?: string;
  fax?: string;
  nfe_email?: string;
  client_login?: string;
  client_password?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientTableItem extends Client {
  contact_persons_display?: React.ReactNode;
}
