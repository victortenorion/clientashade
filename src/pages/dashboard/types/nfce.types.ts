
export interface NFCe {
  id: string;
  numero_nfce: number;
  serie: number;
  client_id: string;
  data_emissao: string;
  data_saida: string | null;
  status_sefaz: string;
  valor_produtos: number;
  valor_desconto: number;
  valor_frete: number;
  valor_seguro: number;
  valor_outras_despesas: number;
  valor_total: number;
  forma_pagamento: string;
  ambiente: string;
  cancelada: boolean;
  motivo_cancelamento: string | null;
  data_cancelamento: string | null;
  chave_acesso: string | null;
  protocolo_autorizacao: string | null;
  xml_envio: string | null;
  xml_retorno: string | null;
  danfe_url: string | null;
  clients?: {
    name: string;
    document: string | null;
  };
}

export interface NFCeItem {
  id: string;
  nfce_id: string;
  product_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  valor_desconto: number;
  ncm: string | null;
  cfop: string | null;
  unidade: string | null;
  products?: {
    name: string;
    description: string | null;
  };
}

export interface NFCeFormData {
  client_id: string;
  items: {
    product_id: string;
    quantidade: number;
    valor_unitario: number;
    valor_desconto?: number;
    ncm?: string;
    cfop?: string;
    unidade?: string;
  }[];
  forma_pagamento: string;
  data_saida?: string;
}
