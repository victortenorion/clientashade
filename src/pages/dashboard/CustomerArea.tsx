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
  invoice_number: string;
  invoice_key: string;
  shipping_company: string;
  tracking_code: string;
}

const CustomerArea = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [visibleFields, setVisibleFields] = useState<CustomerAreaField[]>([]);
  const [clientName, setClientName] = useState<string>("");
  const [allowCreateOrders, setAllowCreateOrders] = useState(false);
  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewOrderForm>({
    equipment: "",
    equipment_serial_number: "",
    problem: "",
    description: "",
    invoice_number: "",
    invoice_key: "",
    shipping_company: "",
    tracking_code: "",
  });
  const { toast } = useToast();

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchCustomerAreaSettings();
      
      if (!allowCreateOrders) {
        toast({
          variant: "destructive",
          title: "Erro ao processar ordem de serviço",
          description: "A criação/edição de ordens está desabilitada no momento"
        });
        return;
      }

      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        toast({
          variant: "destructive",
          title: "Erro ao processar ordem de serviço",
          description: "Cliente não identificado"
        });
        return;
      }

      const { data: statusData, error: statusError } = await supabase
        .from("service_order_statuses")
        .select("id")
        .eq("name", "Cliente enviando")
        .single();

      if (statusError) throw statusError;

      const orderData = {
        client_id: clientId,
        equipment: formData.equipment,
        equipment_serial_number: formData.equipment_serial_number,
        problem: formData.problem,
        description: formData.description,
        created_by_type: 'client',
        status_id: statusData.id,
        invoice_number: formData.invoice_number,
        invoice_key: formData.invoice_key,
        shipping_company: formData.shipping_company,
        tracking_code: formData.tracking_code
      };

      let error;

      if (editingOrderId) {
        // Atualizar ordem existente
        ({ error } = await supabase
          .from("service_orders")
          .update(orderData)
          .eq('id', editingOrderId));
      } else {
        // Criar nova ordem
        ({ error } = await supabase
          .from("service_orders")
          .insert(orderData));
      }

      if (error) throw error;

      toast({
        title: editingOrderId 
          ? "Ordem de serviço atualizada com sucesso"
          : "Ordem de serviço criada com sucesso",
      });
      
      setCreateOrderDialogOpen(false);
      setEditingOrderId(null);
      setFormData({
        equipment: "",
        equipment_serial_number: "",
        problem: "",
        description: "",
        invoice_number: "",
        invoice_key: "",
        shipping_company: "",
        tracking_code: "",
      });
      fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao processar ordem de serviço",
        description: error.message
      });
    }
  };

  const handleEditOrder = (order: ServiceOrder) => {
    setEditingOrderId(order.id);
    setFormData({
      equipment: order.equipment || "",
      equipment_serial_number: order.equipment_serial_number || "",
      problem: order.problem || "",
      description: order.description || "",
      invoice_number: "", // Mantendo campos vazios pois não fazem parte da ServiceOrder
      invoice_key: "",
      shipping_company: "",
      tracking_code: "",
    });
    setCreateOrderDialogOpen(true);
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
        .single();

      if (error) {
        console.error("Erro ao buscar configurações:", error);
        throw error;
      }
      
      if (data) {
        setAllowCreateOrders(data.allow_create_orders || false);
      } else {
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
          status:service_order_statuses!fk_service_order_status (
            name,
            color
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Ordens recebidas:", data);
      if (data) {
        setOrders(data as ServiceOrder[]);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-4">
            <Button variant="outline" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => {
                  setEditingOrderId(null);
                  setFormData({
                    equipment: "",
                    equipment_serial_number: "",
                    problem: "",
                    description: "",
                    invoice_number: "",
                    invoice_key: "",
                    shipping_company: "",
                    tracking_code: "",
                  });
                  setCreateOrderDialogOpen(true);
                }}
                className="bg-[#ea384c] hover:bg-[#ea384c]/90 whitespace-nowrap"
              >
                <Plus className="mr-2 h-4 w-4" />
                Incluir Ordem de Serviço
              </Button>
              <Button variant="outline" onClick={handleLogout} className="whitespace-nowrap">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Minhas Ordens de Serviço</h2>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{clientName}</span>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleFields.filter(field => field.visible).map((field) => (
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
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={visibleFields.length + 1} className="text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleFields.length + 1} className="text-center">
                        Nenhuma ordem de serviço encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        {visibleFields.filter(field => field.visible).map((field) => (
                          <TableCell key={field.field_name}>
                            {getFieldValue(order, field.field_name)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={createOrderDialogOpen} onOpenChange={setCreateOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOrderId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOrder} className="space-y-4">
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
              <Label htmlFor="invoice_number">Número da Nota Fiscal de Envio</Label>
              <Input
                id="invoice_number"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_key">Chave da Nota Fiscal</Label>
              <Input
                id="invoice_key"
                name="invoice_key"
                value={formData.invoice_key}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_company">Transportadora</Label>
              <Input
                id="shipping_company"
                name="shipping_company"
                value={formData.shipping_company}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking_code">Código de Rastreio</Label>
              <Input
                id="tracking_code"
                name="tracking_code"
                value={formData.tracking_code}
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
                {editingOrderId ? 'Salvar' : 'Criar Ordem'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerArea;
