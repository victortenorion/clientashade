
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
}

const defaultFormData: ServiceOrderFormData = {
  client_id: "",
  description: "",
  total_price: 0,
  status_id: "",
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
          client:clients(name),
          status:service_order_statuses(name, color)
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
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
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status_id">Status</Label>
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
              <Label htmlFor="total_price">Valor Total</Label>
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
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar</Button>
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
