import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Edit, Trash, Printer, Download, Plus, Receipt, FileSpreadsheet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface ServiceOrder {
  id: string;
  order_number: number;
  created_at: string;
  client: {
    name: string;
  } | null;
  total_price: number;
  description: string;
  status: {
    name: string;
    color: string;
  } | null;
  codigo_servico: string;
  iss_retido: boolean;
  base_calculo: number;
  aliquota_iss: number;
}

export default function ServiceOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: serviceOrders, isLoading } = useQuery({
    queryKey: ['serviceOrders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          id,
          order_number,
          created_at,
          client:client_id!inner (
            name
          ),
          total_price,
          description,
          status:status_id (
            name,
            color
          ),
          codigo_servico,
          iss_retido,
          base_calculo,
          aliquota_iss
        `)
        .eq('excluida', false)
        .order('created_at', { ascending: false })
        .returns<ServiceOrder[]>();

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar ordens de serviço",
          description: error.message
        });
        throw error;
      }

      return data || [];
    }
  });

  const handleCreateNew = () => {
    navigate("/dashboard/service-orders/new");
  };

  const handleViewDetails = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/dashboard/service-orders/${id}`);
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/dashboard/service-orders/edit/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      try {
        const { error } = await supabase
          .from('service_orders')
          .update({
            excluida: true,
            data_exclusao: new Date().toISOString(),
            motivo_exclusao: 'Excluída pelo usuário'
          })
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Ordem de serviço excluída com sucesso"
        });

        queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro ao excluir ordem de serviço",
          description: error.message
        });
      }
    }
  };

  const handlePrint = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { data: order, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:client_id (
            name,
            street,
            street_number,
            complement,
            neighborhood,
            city,
            state,
            phone_landline,
            mobile_phone
          ),
          status:status_id (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const clientAddress = order.client ? [
        order.client.street,
        order.client.street_number,
        order.client.complement,
        order.client.neighborhood,
        `${order.client.city}/${order.client.state}`
      ].filter(Boolean).join(', ') : 'N/A';

      const clientPhone = order.client ? (order.client.mobile_phone || order.client.phone_landline || 'N/A') : 'N/A';

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Por favor, permita popups para imprimir a ordem de serviço."
        });
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Ordem de Serviço #${order.order_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .info { margin-bottom: 20px; }
              .info div { margin: 5px 0; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Ordem de Serviço #${order.order_number}</h1>
            </div>
            <div class="info">
              <div><strong>Cliente:</strong> ${order.client?.name || 'N/A'}</div>
              <div><strong>Endereço:</strong> ${clientAddress}</div>
              <div><strong>Telefone:</strong> ${clientPhone}</div>
              <div><strong>Data:</strong> ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</div>
              <div><strong>Status:</strong> ${order.status?.name || 'N/A'}</div>
              <div><strong>Descrição:</strong> ${order.description || 'N/A'}</div>
              <div><strong>Valor Total:</strong> ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(order.total_price)}</div>
            </div>
            <button onclick="window.print()">Imprimir</button>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar impressão",
        description: error.message
      });
    }
  };

  const handleDownloadNFSe = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toast({
      title: "Em breve",
      description: "O download da NFS-e estará disponível após a integração com a Prefeitura de SP."
    });
  };

  const handleGenerateNFSe = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/dashboard/nfse/new?service_order_id=${id}`);
  };

  const handleGenerateNFCe = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/dashboard/nfce/new?service_order_id=${id}`);
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
              <TableHead>Cód. Serviço</TableHead>
              <TableHead>ISS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Base Cálc.</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceOrders?.map((order) => (
              <TableRow
                key={order.id}
                className="hover:bg-muted/50"
              >
                <TableCell>{order.order_number}</TableCell>
                <TableCell>
                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>{order.client?.name || 'N/A'}</TableCell>
                <TableCell>{order.codigo_servico || 'N/A'}</TableCell>
                <TableCell>
                  <span className={order.iss_retido ? "text-yellow-600" : "text-green-600"}>
                    {order.iss_retido ? 'Retido' : 'Normal'}
                  </span>
                </TableCell>
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
                  }).format(order.base_calculo || 0)}
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(order.total_price)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleViewDetails(e, order.id)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEdit(e, order.id)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handlePrint(e, order.id)}
                      title="Imprimir OS"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleGenerateNFSe(e, order.id)}
                      title="Gerar NFS-e"
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleGenerateNFCe(e, order.id)}
                      title="Gerar NFC-e"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDownloadNFSe(e, order.id)}
                      title="Download NFS-e"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, order.id)}
                      title="Excluir"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
