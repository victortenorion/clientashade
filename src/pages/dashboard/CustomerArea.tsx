
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";

interface ServiceOrder {
  id: string;
  description: string;
  status_id: string | null;
  status: {
    name: string;
    color: string;
  } | null;
  total_price: number;
  created_at: string;
  order_number: number;
  priority: string;
  equipment: string | null;
  equipment_serial_number: string | null;
  problem: string | null;
  expected_date: string | null;
  completion_date: string | null;
  exit_date: string | null;
}

interface CustomerAreaField {
  field: string;
  visible: boolean;
}

const CustomerArea = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [visibleFields, setVisibleFields] = useState<CustomerAreaField[]>([]);
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('clientId');
    navigate('/client-login');
    toast({
      title: "Logout realizado com sucesso",
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const fetchVisibleFields = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_area_field_settings")
        .select("field_name, visible");

      if (error) throw error;

      // Mapear todos os campos para o formato esperado
      setVisibleFields(data.map(item => ({
        field: item.field_name,
        visible: item.visible
      })));
    } catch (error: any) {
      console.error("Erro ao carregar configurações dos campos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações dos campos",
        description: error.message
      });
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const clientId = localStorage.getItem('clientId');
      
      if (!clientId) {
        navigate('/client-login');
        return;
      }

      const { data, error } = await supabase
        .from("service_orders")
        .select(`
          id,
          description,
          status_id,
          total_price,
          created_at,
          order_number,
          priority,
          equipment,
          equipment_serial_number,
          problem,
          expected_date,
          completion_date,
          exit_date,
          status:service_order_statuses!fk_service_order_status(name, color)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear os dados para garantir a tipagem correta
      const typedOrders: ServiceOrder[] = (data || []).map(order => ({
        id: order.id,
        description: order.description,
        status_id: order.status_id,
        status: order.status?.[0] ? {
          name: order.status[0].name,
          color: order.status[0].color
        } : null,
        total_price: order.total_price,
        created_at: order.created_at,
        order_number: order.order_number,
        priority: order.priority,
        equipment: order.equipment,
        equipment_serial_number: order.equipment_serial_number,
        problem: order.problem,
        expected_date: order.expected_date,
        completion_date: order.completion_date,
        exit_date: order.exit_date
      }));

      setOrders(typedOrders);
    } catch (error: any) {
      console.error("Erro completo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkClientAndFetch = async () => {
      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        navigate('/client-login');
        return;
      }
      await Promise.all([fetchOrders(), fetchVisibleFields()]);
    };

    checkClientAndFetch();
  }, [navigate]);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleString('pt-BR');
  };

  const getFieldValue = (order: ServiceOrder, field: string) => {
    switch (field) {
      case 'order_number':
        return String(order.order_number).padStart(6, '0');
      case 'created_at':
        return formatDate(order.created_at);
      case 'status':
        return (
          <span 
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{ 
              backgroundColor: order.status?.color ? `${order.status.color}20` : '#f3f4f6',
              color: order.status?.color || '#374151'
            }}
          >
            {order.status?.name || "Sem status"}
          </span>
        );
      case 'priority':
        return order.priority;
      case 'equipment':
        return order.equipment;
      case 'equipment_serial_number':
        return order.equipment_serial_number;
      case 'problem':
        return order.problem;
      case 'description':
        return order.description;
      case 'expected_date':
        return formatDate(order.expected_date);
      case 'completion_date':
        return formatDate(order.completion_date);
      case 'exit_date':
        return formatDate(order.exit_date);
      case 'total_price':
        return order.total_price.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">Minhas Ordens de Serviço</h2>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleFields.map((field) => (
                <TableHead key={field.field}>
                  {field.field === 'order_number' && 'Número'}
                  {field.field === 'created_at' && 'Data de Criação'}
                  {field.field === 'status' && 'Status'}
                  {field.field === 'priority' && 'Prioridade'}
                  {field.field === 'equipment' && 'Equipamento'}
                  {field.field === 'equipment_serial_number' && 'Número de Série'}
                  {field.field === 'problem' && 'Problema'}
                  {field.field === 'description' && 'Descrição'}
                  {field.field === 'expected_date' && 'Previsão'}
                  {field.field === 'completion_date' && 'Conclusão'}
                  {field.field === 'exit_date' && 'Saída'}
                  {field.field === 'total_price' && 'Valor Total'}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleFields.length} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleFields.length} className="text-center">
                  Nenhuma ordem de serviço encontrada
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  {visibleFields.map((field) => (
                    <TableCell key={field.field}>
                      {getFieldValue(order, field.field)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomerArea;
