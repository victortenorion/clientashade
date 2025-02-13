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
import { Plus, Trash2, Pencil, Settings2, ListFilter, Users, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Status {
  id: string;
  name: string;
  color: string;
  description: string;
  is_active: boolean;
}

const ServiceOrderSettings = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#000000",
    description: "",
  });
  const { toast } = useToast();

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_order_statuses")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setStatuses(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar status",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStatus) {
        const { error } = await supabase
          .from("service_order_statuses")
          .update(formData)
          .eq("id", editingStatus.id);

        if (error) throw error;

        toast({
          title: "Status atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("service_order_statuses")
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Status criado com sucesso",
        });
      }

      setDialogOpen(false);
      setFormData({ name: "", color: "#000000", description: "" });
      setEditingStatus(null);
      fetchStatuses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingStatus ? "Erro ao atualizar status" : "Erro ao criar status",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("service_order_statuses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status excluído com sucesso",
      });

      fetchStatuses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir status",
        description: error.message,
      });
    }
  };

  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color || "#000000",
      description: status.description || "",
    });
    setDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Configurações de Ordem de Serviço</h2>
        </div>
        
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="w-full justify-start bg-muted/30 p-0 h-12">
            <TabsTrigger value="status" className="data-[state=active]:bg-background rounded-none h-12 px-6">
              <Settings2 className="h-4 w-4 mr-2" />
              Status
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-background rounded-none h-12 px-6">
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="filters" className="data-[state=active]:bg-background rounded-none h-12 px-6">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-background rounded-none h-12 px-6">
              <ListFilter className="h-4 w-4 mr-2" />
              Listagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Status</h3>
                  <Button onClick={() => {
                    setEditingStatus(null);
                    setFormData({ name: "", color: "#000000", description: "" });
                    setDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Status
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : statuses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            Nenhum status encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        statuses.map((status) => (
                          <TableRow key={status.id}>
                            <TableCell className="font-medium">{status.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: status.color }}
                                />
                                {status.color}
                              </div>
                            </TableCell>
                            <TableCell>{status.description}</TableCell>
                            <TableCell>
                              {status.is_active ? (
                                <span className="text-green-600">Ativo</span>
                              ) : (
                                <span className="text-red-600">Inativo</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEdit(status)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDelete(status.id)}
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Configurações de campos do cadastro de clientes em desenvolvimento. Aqui você poderá escolher quais campos aparecerão na listagem e no cadastro de clientes.</p>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="mt-6">
            <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Configurações de filtros em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Configurações de listagens em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? "Editar Status" : "Novo Status"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-20"
                  required
                />
                <Input
                  value={formData.color}
                  onChange={handleInputChange}
                  name="color"
                  className="font-mono"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => {
                setDialogOpen(false);
                setEditingStatus(null);
                setFormData({ name: "", color: "#000000", description: "" });
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingStatus ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceOrderSettings;
