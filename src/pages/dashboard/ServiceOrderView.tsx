
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
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
  equipment: string;
  equipment_serial_number: string;
  problem: string;
  reception_notes: string;
  expected_date: string | null;
  completion_date: string | null;
  exit_date: string | null;
  status: {
    name: string;
    color: string;
  } | null;
}

export default function ServiceOrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServiceOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('service_orders')
          .select(`
            *,
            client:client_id (
              name
            ),
            status:status_id (
              name,
              color
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        setServiceOrder(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar ordem de serviço",
          description: error.message
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceOrder();
  }, [id]);

  const goBack = () => navigate('/dashboard/service-orders');

  if (isLoading) {
    return (
      <div className="container py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!serviceOrder) {
    return (
      <div className="container py-8">
        <p>Ordem de serviço não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        {serviceOrder.status && (
          <Badge
            style={{
              backgroundColor: serviceOrder.status.color + '20',
              color: serviceOrder.status.color
            }}
          >
            {serviceOrder.status.name}
          </Badge>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          Ordem de Serviço #{serviceOrder.order_number}
        </h1>
        <p className="text-sm text-muted-foreground">
          Criada em {format(new Date(serviceOrder.created_at), 'dd/MM/yyyy HH:mm')}
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Informações Gerais</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Cliente</p>
                <p>{serviceOrder.client?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Valor Total</p>
                <p>{new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(serviceOrder.total_price)}</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-sm text-muted-foreground">Descrição</p>
              <p>{serviceOrder.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Equipamento</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Equipamento</p>
                <p>{serviceOrder.equipment || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Número de Série</p>
                <p>{serviceOrder.equipment_serial_number || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-sm text-muted-foreground">Problema Relatado</p>
              <p>{serviceOrder.problem || 'N/A'}</p>
            </div>
            {serviceOrder.reception_notes && (
              <div>
                <p className="font-medium text-sm text-muted-foreground">Observações de Recepção</p>
                <p>{serviceOrder.reception_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Datas</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Previsão</p>
                <p>{serviceOrder.expected_date 
                  ? format(new Date(serviceOrder.expected_date), 'dd/MM/yyyy')
                  : 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Conclusão</p>
                <p>{serviceOrder.completion_date 
                  ? format(new Date(serviceOrder.completion_date), 'dd/MM/yyyy')
                  : 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Saída</p>
                <p>{serviceOrder.exit_date 
                  ? format(new Date(serviceOrder.exit_date), 'dd/MM/yyyy')
                  : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

