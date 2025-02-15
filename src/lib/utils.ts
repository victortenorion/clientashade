
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "concluído":
    case "concluido":
    case "aprovado":
      return "border-green-500 text-green-700 bg-green-50";
    case "pendente":
    case "em análise":
    case "em andamento":
      return "border-yellow-500 text-yellow-700 bg-yellow-50";
    case "rejeitado":
    case "cancelado":
      return "border-red-500 text-red-700 bg-red-50";
    default:
      return "border-gray-500 text-gray-700 bg-gray-50";
  }
}
