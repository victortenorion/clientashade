import { Json } from "@/integrations/supabase/types";

export interface ContactPerson {
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  fantasy_name: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  client_login: string | null;
  client_password: string | null;
  person_type: 'PF' | 'PJ' | null;
  state_registration: string | null;
  state_registration_exempt: boolean;
  municipal_registration: string | null;
  zip_code: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  street_number: string | null;
  complement: string | null;
  contact_info: string | null;
  contact_persons: ContactPerson[] | null;
  phone_landline: string | null;
  fax: string | null;
  mobile_phone: string | null;
  phone_carrier: string | null;
  website: string | null;
  nfe_email: string | null;
  store_id: string | null;
}

export interface ClientFormData {
  name: string;
  fantasy_name: string;
  email: string;
  phone: string;
  document: string;
  client_login: string;
  client_password: string;
  person_type: string;
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
  contact_persons: ContactPerson[];
  phone_landline: string;
  fax: string;
  mobile_phone: string;
  phone_carrier: string;
  website: string;
  nfe_email: string;
  store_id: string;
}

export interface DeleteDialogState {
  isOpen: boolean;
  clientId: string | null;
  withOrders: boolean;
  adminPassword: string;
}
