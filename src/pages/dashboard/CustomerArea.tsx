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
import { LogOut, ArrowLeft, User, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  field_name: string;
  visible: boolean;
}

interface NewOrderForm {
  equipment: string;
  equipment_serial_number: string;
  problem: string;
  description: string;
}

const CustomerArea = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [visibleFields, setVisibleFields] = useState<CustomerAreaField[]>([]);
  const [clientName, setClientName] = useState<string>("");
  const [allowCreateOrders, setAllowCreateOrders] = useState(false);
  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false);
  const [formData, setFormData] = useState<NewOrderForm>({
    equipment: "",
    equipment_serial_number: "",
    problem: "",
    description: "",
  });
  const { toast } = useToast();

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!allowCreateOrders) {
        toast({
          variant: "destructive",
          title: "Erro ao criar ordem de serviço",
          description: "A criação de ordens está desabilitada no momento"
        });
        return;
      }

      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        toast({
          variant: "destructive",
          title: "Erro ao criar ordem de serviço",
          description: "Cliente não identificado"
        });
        return;
      }

      const { error } = await supabase
        .from("service_orders")
        .insert({
          client_id: clientId,
          equipment: formData.equipment,
          equipment_serial_number: formData.equipment_serial_number,
          problem: formData.problem,
          description: formData.description,
          created_by_type: 'client'
        });

      if (error) throw error;

      toast({
        title: "Ordem de serviço criada com sucesso",
      });
      
      setCreateOrderDialogOpen(false);
      setFormData({
        equipment: "",
        equipment_serial_number: "",
        problem: "",
        description: "",
      });
      fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar ordem de serviço",
        description: error.message
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const fetchClientName = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("name")
        .eq('id', clientId)
        .single();

      if (error) throw error;
      if (data) {
        setClientName(data.name);
      }
    } catch (error: any) {
      console.error("Erro ao carregar nome do cliente:", error);
    }
  };

  const fetchCustomerAreaSettings = async () => {
    try {
      console.log("Buscando configurações da área do cliente...");
      const { data, error } = await supabase
        .from('customer_area_settings')
        .select('allow_create_orders')
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar configurações:", error);
        throw error;
      }
      
      console.log("Configurações recebidas:", data);
      
      if (data) {
        console.log("Valor de allow_create_orders:", data.allow_create_orders);
        setAllowCreateOrders(data.allow_create_orders || false);
      } else {
        console.log("Nenhuma configuração encontrada, definindo como false");
        setAllowCreateOrders(false);
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações da área do cliente:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: error.message
      });
    }
  };

  const fetchVisibleFields = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_area_field_settings")
        .select("field_name, visible")
        .eq('visible', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        const defaultFields = [
          'order_number', 'created_at', 'status', 'priority', 'equipment', 
          'equipment_serial_number', 'problem', 'description', 'expected_date', 
          'completion_date', 'exit_date', 'total_price'
        ];
        setVisibleFields(defaultFields.map(field_name => ({ field_name, visible: true })));
      } else {
        setVisibleFields(data);
      }
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

      console.log("Buscando ordens para o cliente:", clientId);

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
          status:service_order_statuses!service_orders_status_id_fkey (
            name,
            color
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar ordens:", error);
        throw error;
      }

      console.log("Ordens recebidas:", data);
      
      if (data) {
        const typedOrders: ServiceOrder[] = data.map(order => ({
          ...order,
          status: order.status || null
        }));
        setOrders(typedOrders);
      }
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
      
      console.log("ClientId encontrado:", clientId);
      
      try {
        await fetchClientName(clientId);
        await Promise.all([
          fetchOrders(), 
          fetchVisibleFields(),
          fetchCustomerAreaSettings()
        ]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    checkClientAndFetch();
  }, [navigate]);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleString('pt-BR');
  };

  const getFieldValue = (order: ServiceOrder, fieldName: string) => {
    switch (fieldName) {
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

  const visibleFieldsList = visibleFields.filter(field => field.visible);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">Minhas Ordens de Serviço</h2>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{clientName}</span>
            </div>
            <div className="flex items-center gap-2">
              {allowCreateOrders && (
                <Button 
                  onClick={() => setCreateOrderDialogOpen(true)}
                  className="bg-[#ea384c] hover:bg-[#ea384c]/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Incluir Ordem de Serviço
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleFieldsList?.map((field) => (
                <TableHead key={field.field_name}>
                  {field.field_name === 'order_number' && 'Número'}
                  {field.field_name === 'created_at' && 'Data de Criação'}
                  {field.field_name === 'status' && 'Status'}
                  {field.field_name === 'priority' && 'Prioridade'}
                  {field.field_name === 'equipment' && 'Equipamento'}
                  {field.field_name === 'equipment_serial_number' && 'Número de Série'}
                  {field.field_name === 'problem' && 'Problema'}
                  {field.field_name === 'description' && 'Descrição'}
                  {field.field_name === 'expected_date' && 'Previsão'}
                  {field.field_name === 'completion_date' && 'Conclusão'}
                  {field.field_name === 'exit_date' && 'Saída'}
                  {field.field_name === 'total_price' && 'Valor Total'}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleFieldsList?.length || 1} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleFieldsList?.length || 1} className="text-center">
                  Nenhuma ordem de serviço encontrada
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  {visibleFieldsList?.map((field) => (
                    <TableCell key={field.field_name}>
                      {getFieldValue(order, field.field_name)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOrderDialogOpen} onOpenChange={setCreateOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipamento *</Label>
              <Input
                id="equipment"
                name="equipment"
                value={formData.equipment}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment_serial_number">Número de Série</Label>
              <Input
                id="equipment_serial_number"
                name="equipment_serial_number"
                value={formData.equipment_serial_number}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="problem">Problema *</Label>
              <Textarea
                id="problem"
                name="problem"
                value={formData.problem}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Adicional</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOrderDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Ordem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerArea;
