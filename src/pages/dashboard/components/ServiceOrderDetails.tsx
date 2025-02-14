
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Printer, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ServiceOrderDetails {
  id: string;
  order_number: number;
  description: string;
  client: {
    name: string;
    document: string;
    phone: string;
    email: string;
  };
  status: {
    name: string;
    color: string;
  };
  equipment: string;
  equipment_serial_number: string;
  problem: string;
  reception_notes: string;
  internal_notes: string;
  expected_date: string;
  completion_date: string;
  exit_date: string;
  total_price: number;
  created_at: string;
  items: {
    id: string;
    description: string;
    price: number;
  }[];
}

export const ServiceOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<ServiceOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("service_orders")
          .select(`
            *,
            client:clients(name, document, phone, email),
            status:service_order_statuses!service_orders_status_id_fkey(name, color),
            items:service_order_items(id, description, price)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setOrder(data as ServiceOrderDetails);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar detalhes da ordem",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!order) {
    return <div>Ordem não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            Ordem de Serviço #{String(order.order_number).padStart(6, '0')}
          </h2>
        </div>
        <Button onClick={handlePrint} className="print:hidden">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Nome:</strong> {order.client.name}</p>
            <p><strong>Documento:</strong> {order.client.document}</p>
            <p><strong>Telefone:</strong> {order.client.phone}</p>
            <p><strong>Email:</strong> {order.client.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Equipamento:</strong> {order.equipment}</p>
            <p><strong>Número de Série:</strong> {order.equipment_serial_number}</p>
            <p><strong>Problema:</strong> {order.problem}</p>
            <p><strong>Status:</strong> 
              <span 
                className="ml-2 px-2 py-1 rounded-full text-xs font-semibold"
                style={{ 
                  backgroundColor: order.status?.color ? `${order.status.color}20` : '#f3f4f6',
                  color: order.status?.color || '#374151'
                }}
              >
                {order.status?.name || "Sem status"}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Data de Criação:</strong></p>
              <p>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            {order.expected_date && (
              <div>
                <p><strong>Previsão:</strong></p>
                <p>{format(new Date(order.expected_date), 'dd/MM/yyyy')}</p>
              </div>
            )}
            {order.completion_date && (
              <div>
                <p><strong>Conclusão:</strong></p>
                <p>{format(new Date(order.completion_date), 'dd/MM/yyyy')}</p>
              </div>
            )}
            {order.exit_date && (
              <div>
                <p><strong>Saída:</strong></p>
                <p>{format(new Date(order.exit_date), 'dd/MM/yyyy')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between border-b pb-2">
                  <span>{item.description}</span>
                  <span className="font-medium">
                    {item.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold">
                <span>Total</span>
                <span>
                  {order.total_price.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {(order.reception_notes || order.internal_notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.reception_notes && (
                <div>
                  <p className="font-medium">Observações do Recebimento:</p>
                  <p>{order.reception_notes}</p>
                </div>
              )}
              {order.internal_notes && (
                <div>
                  <p className="font-medium">Observações Internas:</p>
                  <p>{order.internal_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none;
          }
          #root > div > div {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
