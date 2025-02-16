
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

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterState {
  searchTerm: string;
  status: 'all' | 'active' | 'inactive';
  aliquotaRange: {
    min: number | '';
    max: number | '';
  };
}

export type SortOrder = 'asc' | 'desc';
export type SortField = 'code' | 'description' | 'aliquota_iss';
