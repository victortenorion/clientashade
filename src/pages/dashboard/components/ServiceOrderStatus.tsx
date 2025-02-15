
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface StatusProps {
  status: {
    id: string;
    name: string;
    color: string;
  };
}

export const ServiceOrderStatus: React.FC<StatusProps> = ({ status }) => {
  return (
    <Badge variant="outline" style={{ backgroundColor: status.color, color: '#fff' }}>
      {status.name}
    </Badge>
  );
};
