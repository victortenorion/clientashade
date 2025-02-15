
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Plus, Trash2, Pencil, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NFCeForm } from "./components/NFCeForm";
import { NFCeFormData } from "./types/nfce.types";

interface ServiceOrder {
  id: string;
  created_at: string;
  client_name: string;
  status: string;
  total: number;
  nfce_issued: boolean;
  nfce?: NFCeFormData | null;
}

const ServiceOrders = () => {
  const [loading, setLoading] = useState(true);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedServiceOrder, setSelectedServiceOrder] =
    useState<ServiceOrder | null>(null);
  const [isNFCeFormOpen, setIsNFCeFormOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchServiceOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_orders")
        .select("*")
        .ilike("client_name", `%${searchTerm}%`);

      if (error) throw error;

      setServiceOrders(data || []);
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("service_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Ordem de serviço excluída com sucesso",
      });

      fetchServiceOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir ordem de serviço",
        description: error.message,
      });
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/dashboard/service-orders/${id}`);
  };

  const handleCreateNFCe = (serviceOrder: ServiceOrder) => {
    setSelectedServiceOrder(serviceOrder);
    setIsNFCeFormOpen(true);
  };

  const closeNFCeForm = () => {
    setIsNFCeFormOpen(false);
    setSelectedServiceOrder(null);
    fetchServiceOrders();
  };

  useEffect(() => {
    fetchServiceOrders();
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Ordens de Serviço</h2>
        <Button onClick={() => navigate("/dashboard/service-orders/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ordem de Serviço
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Buscar ordens de serviço..."
          className="max-w-sm"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-center">NFC-e</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : serviceOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhuma ordem de serviço encontrada
                </TableCell>
              </TableRow>
            ) : (
              serviceOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{order.client_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {order.total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    {order.nfce_issued ? (
                      <Receipt className="h-4 w-4 mx-auto text-green-500" />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateNFCe(order)}
                      >
                        Emitir
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(order.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedServiceOrder && (
        <Dialog open={isNFCeFormOpen} onOpenChange={setIsNFCeFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Emitir NFC-e</DialogTitle>
            </DialogHeader>
            <NFCeForm
              onSubmit={handleNFCeSubmit}
              onCancel={() => setIsNFCeFormOpen(false)}
              isLoading={false}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ServiceOrders;
