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
import { Plus, Pencil, Trash2 } from "lucide-react";
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

export default function CustomerArea() {
  const { clientId } = useParams();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    equipment: "",
    equipment_serial_number: "",
    problem: ""
  });
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
        .update(formData)
        .eq("id", editingOrder.id);

      if (error) throw error;

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
      fetchServiceOrders();
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
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o serviço necessário"
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
    </div>
  );
}
