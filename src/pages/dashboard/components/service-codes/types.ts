
export interface ServiceCode {
  id: string;
  code: string;
  description: string;
  aliquota_iss: number;
  active: boolean;
}

export interface ServiceCodeFormData {
  code: string;
  description: string;
  aliquota_iss: number;
}

export interface ImportPreviewData extends ServiceCodeFormData {
  isValid: boolean;
  error?: string;
}

export type SortOrder = 'asc' | 'desc';
export type SortField = 'code' | 'description' | 'aliquota_iss';
