
export interface CustomerAreaSettings {
  id: string;
  store_id: string | null;
  title: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAreaSettingsFormData {
  title: string;
  description: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
}
