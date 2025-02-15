import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Pencil,
  Plus,
  Trash2,
  Eye,
  FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { ServiceOrderStatus } from "./components/ServiceOrderStatus";

interface ServiceOrder {
  id: string;
  created_at: string;
  order_number: string;
  client_id: string;
  equipment: string | null;
  equipment_serial_number: string | null;
  status_id: string;
  notes: string | null;
  total_price: number;
  status: {
    id: string;
    name: string;
    color: string;
  };
  client: {
    name: string;
    document: string;
  };
}

const ServiceOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteServiceOrderId, setDeleteServiceOrderId] = useState<string | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServiceOrders();
  }, [searchTerm]);

  const fetchServiceOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("service_orders")
        .select(
          `
          id,
          created_at,
          order_number,
          client_id,
          equipment,
          equipment_serial_number,
          status_id,
          notes,
          total_price,
          status: status_id (id, name, color),
          client: client_id (name, document)
        `
        )
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `order_number.ilike.%${searchTerm}%,equipment.ilike.%${searchTerm}%,equipment_serial_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%,client_id.name.ilike.%${searchTerm}%,client_id.document.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const typedData = data as unknown as ServiceOrder[];
      setServiceOrders(typedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteServiceOrderId || deleteConfirmationText !== "DELETAR") {
      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description:
          "Por favor, digite 'DELETAR' para confirmar a exclusão da ordem de serviço.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("service_orders")
        .delete()
        .eq("id", deleteServiceOrderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Ordem de serviço deletada",
        description: "A ordem de serviço foi deletada com sucesso.",
      });
      fetchServiceOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description: error.message,
      });
    } finally {
      setIsDialogOpen(false);
      setDeleteServiceOrderId(null);
      setDeleteConfirmationText("");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleGenerateNFSeForm = () => {
    navigate("/dashboard/nfse/new");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar ordens de serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateNFSeForm}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar NFS-e
          </Button>
          <Button onClick={() => navigate("/dashboard/service-orders/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ordem
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : serviceOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Nenhuma ordem de serviço encontrada.
                </TableCell>
              </TableRow>
            ) : (
              serviceOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{order.client.name}</TableCell>
                  <TableCell>{order.equipment}</TableCell>
                  <TableCell>
                    <ServiceOrderStatus status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(order.total_price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          navigate(`/dashboard/service-orders/${order.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          navigate(`/dashboard/service-orders/${order.id}/edit`)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setIsDialogOpen(true);
                          setDeleteServiceOrderId(order.id);
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deletar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja deletar esta ordem de serviço? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Confirmar Exclusão
              </Label>
              <Input
                id="name"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="col-span-3"
                placeholder="Digite 'DELETAR' para confirmar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceOrdersPage;
