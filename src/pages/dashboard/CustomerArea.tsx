
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ServiceOrder } from "./types/service-order-settings.types";

const CustomerArea = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const { data: serviceOrders, isLoading } = useQuery({
    queryKey: ["serviceOrders", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select(`
          *,
          status:service_order_statuses(name, color)
        `)
        .eq("client_id", clientId);

      if (error) throw error;

      return (data || []).map((order) => ({
        ...order,
        status: {
          name: order.status?.[0]?.name || "",
          color: order.status?.[0]?.color || "",
        },
      }));
    },
  });

  return (
    <div className="container py-8">
      <div className="mb-4">
        <Button onClick={() => navigate("/dashboard/clients")}>
          Voltar para Clientes
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Área do Cliente</h1>
      <Separator className="mb-4" />

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Ordens de Serviço</h2>
        {isLoading ? (
          <p>Carregando ordens de serviço...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceOrders?.map((order: ServiceOrder) => (
                <TableRow key={order.id}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{order.description}</TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: order.status.color,
                        color: "white",
                      }}
                    >
                      {order.status.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>R$ {order.total_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/dashboard/service-orders/${order.id}`)
                      }
                    >
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default CustomerArea;
