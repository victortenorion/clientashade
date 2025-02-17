
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { ServiceOrder } from "./types/service-order-settings.types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CustomerArea() {
  const { clientId } = useParams();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      fetchServiceOrders();
    }
  }, [clientId]);

  const fetchServiceOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("service_orders")
        .select(`
          *,
          status:service_order_statuses!inner(*)
        `)
        .eq("client_id", clientId);

      if (error) throw error;

      const formattedOrders: ServiceOrder[] = (data || []).map(order => ({
        ...order,
        status: {
          name: order.status?.name || '',
          color: order.status?.color || ''
        }
      }));

      setServiceOrders(formattedOrders);
    } catch (error: any) {
      console.error("Error fetching service orders:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: "Não foi possível carregar as ordens de serviço. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (orderId: string) => {
    if (orderId) {
      navigate(`/customer-area/${clientId}/service-order/${orderId}`);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-4">
        <Button onClick={() => navigate("/")}>Voltar para Página Inicial</Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Área do Cliente</h1>
      <Separator className="mb-4" />

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Ordens de Serviço</h2>
        {loading ? (
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
              {serviceOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{order.description}</TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: order.status.color, color: 'white' }}>
                      {order.status.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>R$ {order.total_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDetails(order.id)}
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

      <div>
        <h2 className="text-xl font-semibold mb-2">Agendamentos</h2>
        <p>Selecione uma data para ver os agendamentos:</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) =>
                date > new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
