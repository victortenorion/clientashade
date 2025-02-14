
export interface ServiceOrderStatus {
  id: string;
  name: string;
  color: string;
}

export interface ServiceOrder {
  id: string;
  description: string;
  status_id: string;
  total_price: number;
  created_at: string;
  order_number: number;
  priority: string;
  equipment?: string;
  equipment_serial_number?: string;
  problem?: string;
  expected_date?: string;
  completion_date?: string;
  exit_date?: string;
  status: ServiceOrderStatus;
}
