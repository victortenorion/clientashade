
export type ServiceOrderStatus = 
  | "pendente"
  | "em_andamento"
  | "concluido"
  | "cancelado"
  | "aguardando_peca"
  | "aguardando_aprovacao";

export interface ServiceOrder {
  id: string;
  created_at: string;
  client_name: string;
  device: string;
  status: ServiceOrderStatus;
  protocol: string;
}
