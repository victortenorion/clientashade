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
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ServiceOrder {
  id: string;
  description: string;
  status: string;
  total_price: number;
  created_at: string;
}

interface ServiceOrderFormData {
  description: string;
  total_price: number;
}

const defaultFormData: ServiceOrderFormData = {
  description: "",
  total_price: 0,
};

const CustomerArea = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceOrderFormData>(defaultFormData);
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('clientId');
    navigate('/');
    toast({
      title: "Logout realizado com sucesso",
    });
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const clientId = localStorage.getItem('clientId');
      
      if (!clientId) {
        throw new Error("Cliente não identificado");
      }

      const { data, error } = await supabase
        .from("service_orders")
        .select("*")
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      console.error("Erro completo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "total_price" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clientId = localStorage.getItem('clientId');
      
      if (!clientId) {
        throw new Error("Cliente não identificado");
      }

      const { error } = await supabase
        .from("service_orders")
        .insert({
          ...formData,
          client_id: clientId,
        });

      if (error) throw error;

      toast({
        title: "Ordem de serviço criada com sucesso",
      });

      setDialogOpen(false);
      setFormData(defaultFormData);
      fetchOrders();
    } catch (error: any) {
      console.error("Erro completo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar ordem de serviço",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Minhas Ordens de Serviço</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
          <Button variant="destructive" onClick={handleNewOrder}>
            <PlusCircle className="mr-2" />
            Nova Ordem de Serviço
          </Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhuma ordem de serviço encontrada
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.description}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    {order.total_price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleString('pt-BR')}
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
    </div>
  );
};

export default CustomerArea;
