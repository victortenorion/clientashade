
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ServiceOrderStatus } from "@/types/service-order";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: ServiceOrderStatus) {
  switch (status) {
    case "pendente":
      return "text-yellow-500 border-yellow-500";
    case "em_andamento":
      return "text-blue-500 border-blue-500";
    case "concluido":
      return "text-green-500 border-green-500";
    case "cancelado":
      return "text-red-500 border-red-500";
    case "aguardando_peca":
      return "text-orange-500 border-orange-500";
    case "aguardando_aprovacao":
      return "text-purple-500 border-purple-500";
    default:
      return "text-gray-500 border-gray-500";
  }
}
