import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceOrder {
  id: string;
  client_id: string;
  description: string;
  status_id: string | null;
  total_price: number;
  created_at: string;
  created_by_type: 'admin' | 'client';
  seller_id: string | null;
  store_id: string | null;
  equipment: string | null;
  equipment_serial_number: string | null;
  problem: string | null;
  reception_notes: string | null;
  internal_notes: string | null;
  order_number: number;
  expected_date: string | null;
  completion_date: string | null;
  exit_date: string | null;
  start_time: string | null;
  end_time: string | null;
  client: {
    name: string;
  } | null;
  status: {
    name: string;
    color: string;
  } | null;
}

interface ServiceOrderFormData {
  client_id: string;
  description: string;
  total_price: number;
  status_id: string;
  seller_id: string;
  store_id: string;
  equipment: string;
  equipment_serial_number: string;
  problem: string;
  reception_notes: string;
  internal_notes: string;
  expected_date: string;
  completion_date: string;
  exit_date: string;
  start_time: string;
  end_time: string;
}

const defaultFormData: ServiceOrderFormData = {
  client_id: "",
  description: "",
  total_price: 0,
  status_id: "",
  seller_id: "",
  store_id: "",
  equipment: "",
  equipment_serial_number: "",
  problem: "",
  reception_notes: "",
  internal_notes: "",
  expected_date: "",
  completion_date: "",
  exit_date: "",
  start_time: "",
  end_time: "",
};

const ServiceOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceOrderFormData>(defaultFormData);
  const [clients, setClients] = useState<{ id: string; name: string; }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string; }[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string; }[]>([]);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_orders")
        .select(`
          id,
          client_id,
          description,
          status_id,
          total_price,
          created_at,
          created_by_type,
          seller_id,
          store_id,
          equipment,
          equipment_serial_number,
          problem,
          reception_notes,
          internal_notes,
          order_number,
          expected_date,
          completion_date,
          exit_date,
          start_time,
          end_time,
          client:clients(name),
          status:service_order_statuses!service_orders_status_id_fkey(name, color)
        `)
        .ilike("description", `%${searchTerm}%`);

      if (error) throw error;

      setOrders(data as ServiceOrder[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("service_order_statuses")
        .select("id, name")
        .eq("is_active", true);

      if (error) throw error;

      setStatuses(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar status",
        description: error.message,
      });
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name");

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar lojas",
          description: error.message,
        });
        return;
      }

      setStores(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar lojas",
        description: error.message,
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("service_orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Ordem de serviço excluída com sucesso",
      });

      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir ordem de serviço",
        description: error.message,
      });
    }
  };

  const handleConfirmDelete = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handleEditOrder = async (order: ServiceOrder) => {
    setFormData({
      client_id: order.client_id,
      description: order.description,
      total_price: order.total_price,
      status_id: order.status_id || "",
      seller_id: order.seller_id || "",
      store_id: order.store_id || "",
      equipment: order.equipment || "",
      equipment_serial_number: order.equipment_serial_number || "",
      problem: order.problem || "",
      reception_notes: order.reception_notes || "",
      internal_notes: order.internal_notes || "",
      expected_date: order.expected_date || "",
      completion_date: order.completion_date || "",
      exit_date: order.exit_date || "",
      start_time: order.start_time || "",
      end_time: order.end_time || "",
    });
    setDialogOpen(true);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error.message,
      });
      return;
    }

    setClients(data || []);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleNewOrder = () => {
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("service_orders")
        .insert({
          ...formData,
          created_by_type: 'admin'
        });

      if (error) throw error;

      toast({
        title: "Ordem de serviço criada com sucesso",
      });

      setDialogOpen(false);
      setFormData(defaultFormData);
      fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar ordem de serviço",
        description: error.message,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "total_price" ? Number(value) : value,
    }));
  };

  useEffect(() => {
    fetchOrders();
  }, [searchTerm]);

  useEffect(() => {
    fetchClients();
    fetchStatuses();
    fetchStores();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Ordens de Serviço</h2>
        <Button onClick={handleNewOrder}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Buscar ordens..."
          className="max-w-sm"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Criado por</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Nenhuma ordem encontrada
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.client?.name}</TableCell>
                  <TableCell>{order.description}</TableCell>
                  <TableCell>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        backgroundColor: order.status?.color ? `${order.status.color}20` : '#f3f4f6',
                        color: order.status?.color || '#374151'
                      }}
                    >
                      {order.status?.name || "Sem status"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.total_price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {order.created_by_type === 'admin' ? 'Administrador' : 'Cliente'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-500 hover:text-blue-500 hover:bg-blue-50"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleConfirmDelete(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            <p className="text-sm text-muted-foreground">(*) Campos obrigatórios</p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente *</Label>
                  <select
                    id="client_id"
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleInputChange}
                    className="w-full border rounded-md h-10 px-3 bg-background text-foreground"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller_id">Vendedor *</Label>
                    <Input
                      id="seller_id"
                      name="seller_id"
                      value={formData.seller_id}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store_id">Loja *</Label>
                    <select
                      id="store_id"
                      name="store_id"
                      value={formData.store_id}
                      onChange={handleInputChange}
                      className="w-full border rounded-md h-10 px-3 bg-background text-foreground"
                      required
                    >
                      <option value="">Selecione uma loja</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="equipment_serial_number">Número de Série do Equipamento</Label>
                    <Input
                      id="equipment_serial_number"
                      name="equipment_serial_number"
                      value={formData.equipment_serial_number}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Problema *</Label>
                  <Input
                    id="problem"
                    name="problem"
                    value={formData.problem}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reception_notes">Observações do Recebimento</Label>
                  <Input
                    id="reception_notes"
                    name="reception_notes"
                    value={formData.reception_notes}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internal_notes">Observações Internas</Label>
                  <Input
                    id="internal_notes"
                    name="internal_notes"
                    value={formData.internal_notes}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datas e Horários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected_date">Data Prevista</Label>
                    <Input
                      id="expected_date"
                      name="expected_date"
                      type="datetime-local"
                      value={formData.expected_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completion_date">Data Término</Label>
                    <Input
                      id="completion_date"
                      name="completion_date"
                      type="datetime-local"
                      value={formData.completion_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Hora de Início</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Hora de Término</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exit_date">Data de Saída</Label>
                  <Input
                    id="exit_date"
                    name="exit_date"
                    type="datetime-local"
                    value={formData.exit_date}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Ordem de Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status_id">Status *</Label>
                    <select
                      id="status_id"
                      name="status_id"
                      value={formData.status_id}
                      onChange={handleInputChange}
                      className="w-full border rounded-md h-10 px-3 bg-background text-foreground"
                      required
                    >
                      <option value="">Selecione um status</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_price">Valor Total *</Label>
                    <Input
                      id="total_price"
                      name="total_price"
                      type="number"
                      step="0.01"
                      value={formData.total_price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Fechar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceOrders;
