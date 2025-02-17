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
import { Plus, Pencil, Trash2, Search, Filter, User, BellRing } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { ServiceOrder } from "./types/service-order-settings.types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessagesSheet } from "./components/MessagesSheet";
import { cn } from "@/lib/utils";
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

interface Column {
  key: string;
  label: string;
  visible: boolean;
}

interface Client {
  id: string;
  name: string;
  document: string;
}

export default function CustomerArea() {
  const { clientId } = useParams();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [columns, setColumns] = useState<Column[]>([
    { key: "order_number", label: "Número", visible: true },
    { key: "description", label: "Controle Interno", visible: true },
    { key: "equipment", label: "Equipamento", visible: true },
    { key: "equipment_serial_number", label: "Número de Série", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "created_at", label: "Data de Criação", visible: true },
    { key: "total_price", label: "Valor Total", visible: true },
  ]);
  const [formData, setFormData] = useState({
    description: "",
    equipment: "",
    equipment_serial_number: "",
    problem: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [showReadConfirmation, setShowReadConfirmation] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchServiceOrders();
      fetchClientInfo();
    }
  }, [clientId]);

  const checkUnreadMessages = async () => {
    if (!clientId) return;
    
    try {
      const { data: messages, error } = await supabase
        .from('client_messages')
        .select('count')
        .eq('client_id', clientId)
        .eq('is_from_client', false)
        .eq('read', false)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar mensagens:', error);
        return;
      }

      const hasUnread = messages?.count > 0;
      console.log("Mensagens não lidas:", hasUnread);
      setHasUnreadMessages(hasUnread);
    } catch (error) {
      console.error('Erro ao verificar mensagens não lidas:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!clientId) return;

    try {
      const { error } = await supabase
        .from('client_messages')
        .update({ read: true })
        .eq('client_id', clientId)
        .eq('is_from_client', false)
        .eq('read', false);

      if (error) throw error;
      
      setHasUnreadMessages(false);
      setShowReadConfirmation(false);
      toast({
        title: "Mensagens marcadas como lidas",
        description: "Todas as mensagens foram marcadas como lidas.",
      });
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível marcar as mensagens como lidas.",
      });
    }
  };

  useEffect(() => {
    if (!clientId) return;

    checkUnreadMessages();

    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientId} AND is_from_client=eq.false`
        },
        () => {
          if (!isMessagesOpen) {
            checkUnreadMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, isMessagesOpen]);

  useEffect(() => {
    if (isMessagesOpen && hasUnreadMessages) {
      console.log("Abrindo diálogo de confirmação");
      setShowReadConfirmation(true);
    }
  }, [isMessagesOpen, hasUnreadMessages]);

  const fetchClientInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, document")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      setClientInfo(data);
    } catch (error) {
      console.error("Error fetching client info:", error);
    }
  };

  useEffect(() => {
    filterOrders();
  }, [searchTerm, serviceOrders]);

  const filterOrders = () => {
    if (!searchTerm) {
      setFilteredOrders(serviceOrders);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = serviceOrders.filter(order => 
      order.order_number.toString().includes(searchTermLower) ||
      order.description.toLowerCase().includes(searchTermLower) ||
      (order.equipment || "").toLowerCase().includes(searchTermLower) ||
      (order.equipment_serial_number || "").toLowerCase().includes(searchTermLower) ||
      order.status.name.toLowerCase().includes(searchTermLower)
    );
    setFilteredOrders(filtered);
  };

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
      setFilteredOrders(formattedOrders);
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

  const handleColumnToggle = (columnKey: string) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleViewDetails = (orderId: string) => {
    if (orderId) {
      navigate(`/customer-area/${clientId}/service-orders/${orderId}`);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const { data: statusData, error: statusError } = await supabase
        .from("service_order_statuses")
        .select("id")
        .eq("name", "enviando-cliente")
        .single();

      if (statusError) throw statusError;

      const { data, error } = await supabase
        .from("service_orders")
        .insert([
          {
            ...formData,
            client_id: clientId,
            status_id: statusData.id,
            created_by_client: true
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Ordem de serviço criada",
        description: "Sua ordem de serviço foi criada com sucesso.",
      });

      setIsDialogOpen(false);
      setFormData({
        description: "",
        equipment: "",
        equipment_serial_number: "",
        problem: ""
      });
      fetchServiceOrders();
    } catch (error: any) {
      console.error("Error creating service order:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar ordem de serviço",
        description: "Não foi possível criar a ordem de serviço. Tente novamente.",
      });
    }
  };

  const handleEditOrder = async (order: ServiceOrder) => {
    if (order.status.name !== "enviando-cliente") {
      toast({
        variant: "destructive",
        title: "Não é possível editar",
        description: "Apenas ordens com status 'enviando-cliente' podem ser editadas.",
      });
      return;
    }
    setEditingOrder(order);
    setFormData({
      description: order.description,
      equipment: order.equipment || "",
      equipment_serial_number: order.equipment_serial_number || "",
      problem: order.problem || ""
    });
    setIsDialogOpen(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    const order = serviceOrders.find(o => o.id === orderId);
    if (!order || order.status.name !== "enviando-cliente") {
      toast({
        variant: "destructive",
        title: "Não é possível excluir",
        description: "Apenas ordens com status 'enviando-cliente' podem ser excluídas.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("service_orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Ordem de serviço excluída",
        description: "A ordem de serviço foi excluída com sucesso.",
      });

      fetchServiceOrders();
    } catch (error: any) {
      console.error("Error deleting service order:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir ordem de serviço",
        description: "Não foi possível excluir a ordem de serviço. Tente novamente.",
      });
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      const { error } = await supabase
        .from("service_orders")
        .update({
          description: formData.description,
          equipment: formData.equipment,
          equipment_serial_number: formData.equipment_serial_number,
          problem: formData.problem
        })
        .eq("id", editingOrder.id);

      if (error) throw error;

      await fetchServiceOrders();

      toast({
        title: "Ordem de serviço atualizada",
        description: "Sua ordem de serviço foi atualizada com sucesso.",
      });

      setIsDialogOpen(false);
      setEditingOrder(null);
      setFormData({
        description: "",
        equipment: "",
        equipment_serial_number: "",
        problem: ""
      });
    } catch (error: any) {
      console.error("Error updating service order:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar ordem de serviço",
        description: "Não foi possível atualizar a ordem de serviço. Tente novamente.",
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-4 flex justify-between items-center">
        <Button onClick={() => navigate("/")}>Voltar para Página Inicial</Button>
        <div className="flex items-center gap-4">
          {clientInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{clientInfo.name}</span>
              <span className="text-muted-foreground">({clientInfo.document})</span>
            </div>
          )}
          <Sheet 
            open={isMessagesOpen}
            onOpenChange={(open) => {
              setIsMessagesOpen(open);
              if (!open) {
                setShowReadConfirmation(false);
              }
            }}
          >
            <SheetTrigger asChild>
              <Button 
                variant={hasUnreadMessages ? "default" : "outline"}
                className={cn(
                  "relative",
                  hasUnreadMessages && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <BellRing className="h-4 w-4 mr-2" />
                {hasUnreadMessages && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
                )}
                Mensagens
                {hasUnreadMessages && (
                  <span className="ml-2 text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                    Nova
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Mensagens</SheetTitle>
              </SheetHeader>
              <MessagesSheet clientId={clientId || ""} />
            </SheetContent>
          </Sheet>
          <Button onClick={() => {
            setEditingOrder(null);
            setFormData({
              description: "",
              equipment: "",
              equipment_serial_number: "",
              problem: ""
            });
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Ordem de Serviço
          </Button>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">Área do Cliente</h1>
      <Separator className="mb-4" />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Ordens de Serviço</h2>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ordens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <h3 className="font-medium">Colunas visíveis</h3>
                  {columns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.key}
                        checked={column.visible}
                        onCheckedChange={() => handleColumnToggle(column.key)}
                      />
                      <label
                        htmlFor={column.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {column.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {loading ? (
          <p>Carregando ordens de serviço...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  column.visible && (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  )
                ))}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  {columns.map((column) => {
                    if (!column.visible) return null;
                    
                    switch (column.key) {
                      case 'order_number':
                        return <TableCell key={column.key}>{order.order_number}</TableCell>;
                      case 'description':
                        return <TableCell key={column.key}>{order.description}</TableCell>;
                      case 'equipment':
                        return <TableCell key={column.key}>{order.equipment || '-'}</TableCell>;
                      case 'equipment_serial_number':
                        return <TableCell key={column.key}>{order.equipment_serial_number || '-'}</TableCell>;
                      case 'status':
                        return (
                          <TableCell key={column.key}>
                            <Badge style={{ backgroundColor: order.status.color, color: 'white' }}>
                              {order.status.name}
                            </Badge>
                          </TableCell>
                        );
                      case 'created_at':
                        return (
                          <TableCell key={column.key}>
                            {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                        );
                      case 'total_price':
                        return <TableCell key={column.key}>R$ {order.total_price?.toFixed(2) || '0.00'}</TableCell>;
                      default:
                        return null;
                    }
                  })}
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDetails(order.id)}
                      >
                        Ver Detalhes
                      </Button>
                      {order.status.name === "enviando-cliente" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da ordem de serviço abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Controle Interno</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Digite o controle interno"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="equipment">Equipamento</Label>
              <Input
                id="equipment"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                placeholder="Nome do equipamento"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serial">Número de Série</Label>
              <Input
                id="serial"
                value={formData.equipment_serial_number}
                onChange={(e) => setFormData({ ...formData, equipment_serial_number: e.target.value })}
                placeholder="Número de série do equipamento"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="problem">Problema</Label>
              <Textarea
                id="problem"
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                placeholder="Descreva o problema do equipamento"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setEditingOrder(null);
              setFormData({
                description: "",
                equipment: "",
                equipment_serial_number: "",
                problem: ""
              });
            }}>
              Cancelar
            </Button>
            <Button onClick={editingOrder ? handleUpdateOrder : handleCreateOrder}>
              {editingOrder ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showReadConfirmation} onOpenChange={setShowReadConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar mensagens como lidas?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem mensagens não lidas. Deseja marcá-las como lidas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReadConfirmation(false)}>
              Não
            </AlertDialogCancel>
            <AlertDialogAction onClick={markMessagesAsRead}>
              Sim, marcar como lidas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
