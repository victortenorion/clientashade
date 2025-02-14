
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
  DialogFooter,
  DialogTitle,
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
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientBasicInfo } from "./components/ClientBasicInfo";
import { ClientAddress } from "./components/ClientAddress";
import { ClientContact } from "./components/ClientContact";
import { ClientAccess } from "./components/ClientAccess";
import { ClientStore } from "./components/ClientStore";
import {
  Client,
  ClientFormData,
  DeleteDialogState,
  Store,
  ContactPerson
} from "./types/client.types";

interface ServiceOrder {
  id: string;
  client_id: string;
  equipment: string | null;
  equipment_serial_number: string | null;
  problem: string | null;
  description: string;
  status_id: string | null;
  priority: string;
  expected_date: string | null;
  store_id: string | null;
  order_number: number;
  created_at: string;
}

interface ServiceOrderFormData {
  equipment: string;
  equipment_serial_number: string;
  problem: string;
  description: string;
  status_id: string;
  priority: string;
  expected_date: string;
  store_id: string;
}

const defaultServiceOrderFormData: ServiceOrderFormData = {
  equipment: "",
  equipment_serial_number: "",
  problem: "",
  description: "",
  status_id: "",
  priority: "normal",
  expected_date: "",
  store_id: "",
};

const ServiceOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceOrderFormData>(defaultServiceOrderFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultServiceOrderFormData);
    setEditingId(null);
    setSelectedClient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const orderData = {
        client_id: selectedClient?.id,
        equipment: formData.equipment,
        equipment_serial_number: formData.equipment_serial_number,
        problem: formData.problem,
        description: formData.description,
        status_id: formData.status_id,
        priority: formData.priority,
        expected_date: formData.expected_date,
        store_id: formData.store_id
      };

      if (editingId) {
        const { error } = await supabase
          .from("service_orders")
          .update(orderData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Ordem de serviço atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("service_orders")
          .insert([orderData]);

        if (error) throw error;

        toast({
          title: "Ordem de serviço criada com sucesso",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao processar ordem de serviço",
        description: error.message
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar ordem de serviço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.order_number}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{selectedClient?.name}</TableCell>
                <TableCell>{order.description}</TableCell>
                <TableCell>{order.status_id}</TableCell>
                <TableCell>{order.priority}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(order.id);
                      setFormData({
                        equipment: order.equipment || "",
                        equipment_serial_number: order.equipment_serial_number || "",
                        problem: order.problem || "",
                        description: order.description,
                        status_id: order.status_id || "",
                        priority: order.priority,
                        expected_date: order.expected_date || "",
                        store_id: order.store_id || ""
                      });
                      setDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Equipamento</label>
                <Input
                  value={formData.equipment}
                  onChange={(e) =>
                    setFormData({ ...formData, equipment: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Número de Série</label>
                <Input
                  value={formData.equipment_serial_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      equipment_serial_number: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Problema</label>
                <Input
                  value={formData.problem}
                  onChange={(e) =>
                    setFormData({ ...formData, problem: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceOrders;
