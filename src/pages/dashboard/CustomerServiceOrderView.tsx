
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { ServiceOrder } from "./types/service-order-settings.types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Attachment {
  id: string;
  filename: string;
  file_path: string;
  content_type: string;
}

export default function CustomerServiceOrderView() {
  const { orderId, clientId } = useParams();
  const navigate = useNavigate();
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceOrder();
    fetchAttachments();
  }, [orderId]);

  const fetchServiceOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("service_orders")
        .select(`
          *,
          status:service_order_statuses(name, color)
        `)
        .eq("id", orderId)
        .eq("client_id", clientId)
        .single();

      if (error) throw error;

      if (data) {
        setServiceOrder({
          ...data,
          status: {
            name: data.status?.[0]?.name || '',
            color: data.status?.[0]?.color || ''
          }
        });
      }
    } catch (error: any) {
      console.error("Error fetching service order:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordem de serviço",
        description: "Não foi possível carregar os detalhes da ordem de serviço.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('service_order_attachments')
        .select('*')
        .eq('service_order_id', orderId);

      if (error) throw error;

      if (data) {
        setAttachments(data);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar anexos",
        description: "Não foi possível carregar os anexos da ordem de serviço.",
      });
    }
  };

  const getFileUrl = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('service-order-attachments')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return '';
    }
  };

  if (loading) {
    return <div className="container py-8">Carregando...</div>;
  }

  if (!serviceOrder) {
    return <div className="container py-8">Ordem de serviço não encontrada.</div>;
  }

  return (
    <div className="container py-8">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/customer-area/${clientId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Ordem de Serviço #{serviceOrder.order_number}</h1>
        <Badge style={{ backgroundColor: serviceOrder.status.color, color: 'white' }}>
          {serviceOrder.status.name}
        </Badge>
      </div>

      <Separator className="mb-6" />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Informações Gerais</h2>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Data de Criação</p>
                <p>{format(new Date(serviceOrder.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
              <div>
                <p className="font-semibold">Valor Total</p>
                <p>R$ {serviceOrder.total_price.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold">Descrição</p>
              <p>{serviceOrder.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Detalhes do Equipamento</h2>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Equipamento</p>
                <p>{serviceOrder.equipment || "Não informado"}</p>
              </div>
              <div>
                <p className="font-semibold">Número de Série</p>
                <p>{serviceOrder.equipment_serial_number || "Não informado"}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold">Problema Relatado</p>
              <p>{serviceOrder.problem || "Não informado"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Datas</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-semibold">Previsão de Conclusão</p>
              <p>
                {serviceOrder.expected_date
                  ? format(new Date(serviceOrder.expected_date), "dd/MM/yyyy", { locale: ptBR })
                  : "Não informada"}
              </p>
            </div>
            <div>
              <p className="font-semibold">Data de Conclusão</p>
              <p>
                {serviceOrder.completion_date
                  ? format(new Date(serviceOrder.completion_date), "dd/MM/yyyy", { locale: ptBR })
                  : "Não concluída"}
              </p>
            </div>
            <div>
              <p className="font-semibold">Data de Saída</p>
              <p>
                {serviceOrder.exit_date
                  ? format(new Date(serviceOrder.exit_date), "dd/MM/yyyy", { locale: ptBR })
                  : "Não retirado"}
              </p>
            </div>
          </CardContent>
        </Card>

        {serviceOrder.reception_notes && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Observações de Recepção</h2>
            </CardHeader>
            <CardContent>
              <p>{serviceOrder.reception_notes}</p>
            </CardContent>
          </Card>
        )}

        {attachments.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Anexos</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    {attachment.content_type.startsWith('image/') ? (
                      <img
                        src={getFileUrl(attachment.file_path)}
                        alt={attachment.filename}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg">
                        <span className="text-sm text-gray-500">{attachment.filename}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
