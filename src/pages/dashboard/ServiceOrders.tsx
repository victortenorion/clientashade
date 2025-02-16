
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface ServiceOrder {
  id: string;
  order_number: number;
  created_at: string;
  client: {
    name: string;
  };
  total_price: number;
  description: string;
  status: {
    name: string;
    color: string;
  } | null;
}

export default function ServiceOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: serviceOrders, isLoading } = useQuery({
    queryKey: ['serviceOrders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          id,
          order_number,
          created_at,
          client:client_id (
            name
          ),
          total_price,
          description,
          status:status_id (
            name,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar ordens de serviço",
          description: error.message
        });
        throw error;
      }

      return data as ServiceOrder[];
    }
  });

  const handleCreateNew = () => {
    navigate("/dashboard/service-orders/create");
  };

  const handleViewDetails = (id: string) => {
    navigate(`/dashboard/service-orders/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ordens de Serviço</h2>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <span>Carregando...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceOrders?.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleViewDetails(order.id)}
              >
                <TableCell>{order.order_number}</TableCell>
                <TableCell>
                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>{order.client?.name || 'N/A'}</TableCell>
                <TableCell>{order.description}</TableCell>
                <TableCell>
                  {order.status ? (
                    <span
                      className="px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: order.status.color + '20',
                        color: order.status.color
                      }}
                    >
                      {order.status.name}
                    </span>
                  ) : (
                    'Sem Status'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(order.total_price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
