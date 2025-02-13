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
import { Checkbox } from "@/components/ui/checkbox";

interface Status {
  id: string;
  name: string;
  color: string;
  description: string;
  is_active: boolean;
}

interface ClientField {
  id: string;
  label: string;
  field: string;
  visible: boolean;
}

const defaultClientFields: ClientField[] = [
  { id: "1", label: "Nome", field: "name", visible: true },
  { id: "2", label: "Email", field: "email", visible: true },
  { id: "3", label: "Telefone", field: "phone", visible: true },
  { id: "4", label: "Documento", field: "document", visible: true },
  { id: "5", label: "Nome Fantasia", field: "fantasy_name", visible: true },
  { id: "6", label: "Inscrição Estadual", field: "state_registration", visible: true },
  { id: "7", label: "Inscrição Municipal", field: "municipal_registration", visible: true },
  { id: "8", label: "CEP", field: "zip_code", visible: true },
  { id: "9", label: "Estado", field: "state", visible: true },
  { id: "10", label: "Cidade", field: "city", visible: true },
  { id: "11", label: "Bairro", field: "neighborhood", visible: true },
  { id: "12", label: "Logradouro", field: "street", visible: true },
  { id: "13", label: "Número", field: "street_number", visible: true },
  { id: "14", label: "Complemento", field: "complement", visible: true },
  { id: "15", label: "Telefone Fixo", field: "phone_landline", visible: true },
  { id: "16", label: "Fax", field: "fax", visible: true },
  { id: "17", label: "Celular", field: "mobile_phone", visible: true },
  { id: "18", label: "Operadora", field: "phone_carrier", visible: true },
  { id: "19", label: "Website", field: "website", visible: true },
  { id: "20", label: "Email NFe", field: "nfe_email", visible: true },
  { id: "21", label: "Login do Cliente", field: "client_login", visible: true },
];

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
  const [clientFields, setClientFields] = useState<ClientField[]>(defaultClientFields);
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

  const fetchFieldSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("client_field_settings")
        .select("*");

      if (error) throw error;

      if (data) {
        const updatedFields = clientFields.map(field => ({
          ...field,
          visible: data.find(setting => setting.field_name === field.field)?.visible ?? field.visible
        }));
        setClientFields(updatedFields);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações dos campos",
        description: error.message,
      });
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

  const handleFieldVisibilityChange = async (field: string, checked: boolean) => {
    try {
      const { error } = await supabase
        .from("client_field_settings")
        .upsert({ field_name: field, visible: checked }, { onConflict: 'field_name' });

      if (error) throw error;

      setClientFields(prev => 
        prev.map(f => 
          f.field === field ? { ...f, visible: checked } : f
        )
      );

      toast({
        title: "Configuração salva",
        description: `Campo ${field} ${checked ? 'será exibido' : 'será ocultado'} na listagem`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configuração",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    fetchStatuses();
    fetchFieldSettings();
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Campos Visíveis na Listagem de Clientes</h3>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    {defaultClientFields.map((field) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={field.id}
                          checked={clientFields.find(f => f.field === field.field)?.visible ?? field.visible}
                          onCheckedChange={(checked) => 
                            handleFieldVisibilityChange(field.field, checked as boolean)
                          }
                        />
                        <Label htmlFor={field.id}>{field.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecione os campos que deseja exibir na listagem de clientes. As alterações serão salvas automaticamente.
                </p>
              </div>
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
