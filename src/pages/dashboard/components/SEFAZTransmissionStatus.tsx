
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface SEFAZTransmissionStatusProps {
  status: string;
  error?: string;
}

export const SEFAZTransmissionStatus: React.FC<SEFAZTransmissionStatusProps> = ({ 
  status,
  error 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'enviado':
        return 'bg-green-500';
      case 'erro':
        return 'bg-red-500';
      case 'processando':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'enviado':
        return 'Enviado';
      case 'erro':
        return 'Erro';
      case 'processando':
        return 'Processando';
      default:
        return 'Pendente';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className={getStatusColor()}>
        {status === 'processando' && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {getStatusText()}
      </Badge>
      {error && status === 'erro' && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};
