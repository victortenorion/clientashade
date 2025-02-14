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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Receipt, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NFCeForm } from "./components/NFCeForm";
import { NFSeForm } from "./components/NFSeForm";
import { NFCeFormData } from "./types/nfce.types";
import { NFSeFormData } from "./types/nfse.types";

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
  client: {
    name: string;
  } | null;
  status: {
    name: string;
    color: string;
  } | null;
  items: ServiceOrderItem[];
}

interface ServiceOrderItem {
  id: string;
  service_order_id: string;
  description: string;
  price: number;
}

interface ServiceOrderFormData {
  id?: string;
  client_id: string;
  description: string;
  status_id: string;
  seller_id: string;
  seller_name?: string;
  store_id: string;
  equipment: string;
  equipment_serial_number: string;
  problem: string;
  reception_notes: string;
  internal_notes: string;
  expected_date: string;
  completion_date: string;
  exit_date: string;
  items: {
    description: string;
    price: number;
  }[];
}

const defaultFormData: ServiceOrderFormData = {
  client_id: "",
  description: "",
  status_id: "",
  seller_id: "",
  seller_name: "",
  store_id: "",
  equipment: "",
  equipment_serial_number: "",
  problem: "",
  reception_notes: "",
  internal_notes: "",
  expected_date: "",
  completion_date: "",
  exit_date: "",
  items: []
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
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string; name?: string; } } | null>(null);
  const [showNFCeDialog, setShowNFCeDialog] = useState(false);
  const [showNFSeDialog, setShowNFSeDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);

      if (!searchTerm) {
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
            client:clients(name),
            status:service_order_statuses!service_orders_status_id_fkey(name, color),
            items:service_order_items(id, description, price)
          `);

        if (error) throw error;
        setOrders(data as ServiceOrder[]);
        return;
      }

      if (!isNaN(Number(searchTerm))) {
        const orderNumber = Number(searchTerm);
        
        // Verifica se o número está dentro do intervalo permitido para integer
        if (orderNumber > 2147483647 || orderNumber < -2147483648) {
          toast({
            variant: "destructive",
            title: "Número inválido",
            description: "O número da ordem de serviço está fora do intervalo permitido.",
          });
          setOrders([]);
          return;
        }

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
            client:clients(name),
            status:service_order_statuses!service_orders_status_id_fkey(name, color),
            items:service_order_items(id, description, price)
          `)
          .eq('order_number', orderNumber);

        if (error) throw error;
        setOrders(data as ServiceOrder[]);
        return;
      }

      const { data: serialData, error: serialError } = await supabase
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
          client:clients(name),
          status:service_order_statuses!service_orders_status_id_fkey(name, color),
          items:service_order_items(id, description, price)
        `)
        .eq('equipment_serial_number', searchTerm);

      if (serialError) throw serialError;

      if (serialData && serialData.length > 0) {
        setOrders(serialData as ServiceOrder[]);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
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
          client:clients(name),
          status:service_order_statuses!service_orders_status_id_fkey(name, color),
          items:service_order_items(id, description, price)
        `)
        .or(`description.ilike.%${searchTerm}%,equipment.ilike.%${searchTerm}%,equipment_serial_number.ilike.%${searchTerm}%,problem.ilike.%${searchTerm}%`);

      if (ordersError) throw ordersError;

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', `%${searchTerm}%`);

      if (clientsError) throw clientsError;

      let clientOrdersData: any[] = [];
      if (clientsData && clientsData.length > 0) {
        const clientIds = clientsData.map(client => client.id);
        const { data: clientOrders, error: clientOrdersError } = await supabase
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
            client:clients(name),
            status:service_order_statuses!service_orders_status_id_fkey(name, color),
            items:service_order_items(id, description, price)
          `)
          .in('client_id', clientIds);

        if (clientOrdersError) throw clientOrdersError;
        clientOrdersData = clientOrders || [];
      }

      const allOrders = [...(ordersData || []), ...clientOrdersData];
      const uniqueOrders = Array.from(new Map(allOrders.map(order => [order.id, order])).values());

      setOrders(uniqueOrders as ServiceOrder[]);
    } catch (error: any) {
      console.error('Erro na busca:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session?.user) {
      const userName = 
        session.user.user_metadata?.full_name || 
        session.user.user_metadata?.name || 
        session.user.email?.split('@')[0] || 
        'Usuário';

      setCurrentUser(session.user);
      setFormData(prev => ({
        ...prev, 
        seller_id: session.user.id,
        seller_name: userName
      }));
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

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
      id: order.id, // Adicionando o id para identificar que é uma edição
      client_id: order.client_id,
      description: order.description,
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
      items: order.items.map(item => ({
        description: item.description,
        price: item.price
      }))
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
      let serviceOrderData = {
        client_id: formData.client_id,
        description: formData.description,
        status_id: formData.status_id,
        seller_id: currentUser?.id || null,
        store_id: formData.store_id,
        equipment: formData.equipment,
        equipment_serial_number: formData.equipment_serial_number,
        problem: formData.problem,
        reception_notes: formData.reception_notes,
        internal_notes: formData.internal_notes,
        expected_date: formData.expected_date || null,
        completion_date: formData.completion_date || null,
        exit_date: formData.exit_date || null,
        created_by_type: 'admin'
      };

      if (formData.id) {
        const { error: orderError } = await supabase
          .from("service_orders")
          .update(serviceOrderData)
          .eq('id', formData.id);

        if (orderError) throw orderError;

        const { error: deleteError } = await supabase
          .from("service_order_items")
          .delete()
          .eq('service_order_id', formData.id);

        if (deleteError) throw deleteError;

        if (formData.items.length > 0) {
          const { error: itemsError } = await supabase
            .from("service_order_items")
            .insert(
              formData.items.map(item => ({
                service_order_id: formData.id,
                description: item.description,
                price: item.price
              }))
            );

          if (itemsError) throw itemsError;
        }

        toast({
          title: "Ordem de serviço atualizada com sucesso",
        });
      } else {
        const { data: newOrder, error: orderError } = await supabase
          .from("service_orders")
          .insert(serviceOrderData)
          .select()
          .single();

        if (orderError) throw orderError;

        if (formData.items.length > 0) {
          const { error: itemsError } = await supabase
            .from("service_order_items")
            .insert(
              formData.items.map(item => ({
                service_order_id: newOrder.id,
                description: item.description,
                price: item.price
              }))
            );

          if (itemsError) throw itemsError;
        }

        toast({
          title: "Ordem de serviço criada com sucesso",
        });
      }

      setDialogOpen(false);
      setFormData(defaultFormData);
      fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao processar ordem de serviço",
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

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", price: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: 'description' | 'price', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleGenerateNFCe = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowNFCeDialog(true);
  };

  const handleGenerateNFSe = (order: ServiceOrder) => {
    navigate(`/dashboard/nfse/from-service-order/${order.id}`);
  };

  const handleNFCeSubmit = async (data: NFCeFormData) => {
    try {
      toast({
        title: "NFC-e emitida com sucesso",
      });
      setShowNFCeDialog(false);
      setSelectedOrder(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao emitir NFC-e",
        description: error.message,
      });
    }
  };

  const handleNFSeSubmit = async (data: NFSeFormData) => {
    try {
      toast({
        title: "NFS-e emitida com sucesso",
      });
      setShowNFSeDialog(false);
      setSelectedOrder(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao emitir NFS-e",
        description: error.message,
      });
    }
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
              <TableHead className="w-[100px]">Nº OS</TableHead>
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
                <TableCell colSpan={8} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Nenhuma ordem encontrada
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/dashboard/service-orders/${order.id}`)}
                >
                  <TableCell className="font-medium">
                    {String(order.order_number).padStart(6, '0')}
                  </TableCell>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-500 hover:text-blue-500 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrder(order);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-amber-500 hover:text-amber-500 hover:bg-amber-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateNFCe(order);
                        }}
                        title="Gerar NFC-e"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-500 hover:text-green-500 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateNFSe(order);
                        }}
                        title="Gerar NFS-e"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDelete(order.id);
                        }}
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
                    <Label>Vendedor</Label>
                    <Input
                      value={formData.seller_name || currentUser?.user_metadata?.name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || ''}
                      disabled
                      className="bg-muted"
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
                <CardTitle>Datas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected_date">Data Prevista</Label>
                    <Input
                      id="expected_date"
                      name="expected_date"
                      type="date"
                      value={formData.expected_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completion_date">Data Término</Label>
                    <Input
                      id="completion_date"
                      name="completion_date"
                      type="date"
                      value={formData.completion_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exit_date">Data de Saída</Label>
                    <Input
                      id="exit_date"
                      name="exit_date"
                      type="date"
                      value={formData.exit_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Serviços</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Label>Descrição do Serviço *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-32">
                      <Label>Valor *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum serviço adicionado
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
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

      <Dialog open={showNFCeDialog} onOpenChange={setShowNFCeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emitir NFC-e</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <NFCeForm
              onSubmit={handleNFCeSubmit}
              onCancel={() => setShowNFCeDialog(false)}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNFSeDialog} onOpenChange={setShowNFSeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emitir NFS-e</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <NFSeForm
              onSubmit={handleNFSeSubmit}
              onCancel={() => setShowNFSeDialog(false)}
              isLoading={false}
            />
          )}
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
