
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Status,
  ClientField,
  CustomerAreaField,
  FiscalConfig,
} from "./types/service-order-settings.types";

const defaultFormData = {
  name: "",
  color: "#ffffff",
  description: "",
  is_active: true,
};

const ServiceOrderSettings = () => {
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("status");
  const [showSubFields, setShowSubFields] = useState(false);
  const [clientFields, setClientFields] = useState<ClientField[]>([]);
  const [customerAreaFields, setCustomerAreaFields] = useState<CustomerAreaField[]>([]);
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>({
    service_code: "",
    cnae: "",
    tax_regime: "",
  });

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("service_order_statuses")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setStatuses(data || []);
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

  const fetchClientFields = async () => {
    try {
      const { data, error } = await supabase
        .from("client_field_settings")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setClientFields(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar campos do cliente",
        description: error.message,
      });
    }
  };

  const fetchCustomerAreaFields = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_area_field_settings")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setCustomerAreaFields(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar campos da área do cliente",
        description: error.message,
      });
    }
  };

  const fetchFiscalConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("fiscal_config")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFiscalConfig(data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configuração fiscal",
        description: error.message,
      });
    }
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (status: Status) => {
    setFormData({
      name: status.name,
      color: status.color,
      description: status.description,
      is_active: status.is_active,
    });
    setEditingId(status.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("service_order_statuses")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Status excluído com sucesso",
      });

      setDeleteDialogOpen(false);
      setDeleteId(null);
      fetchStatuses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir status",
        description: error.message,
      });
    }
  };

  const handleSave = async () => {
    try {
      const statusData = {
        name: formData.name || "",
        color: formData.color,
        description: formData.description,
        is_active: formData.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("service_order_statuses")
          .update(statusData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Status atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("service_order_statuses")
          .insert([statusData]);

        if (error) throw error;

        toast({
          title: "Status criado com sucesso",
        });
      }

      setDialogOpen(false);
      setFormData(defaultFormData);
      setEditingId(null);
      fetchStatuses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar status",
        description: error.message,
      });
    }
  };

  const handleToggleFieldVisibility = async (
    fieldName: string,
    currentVisibility: boolean,
    type: "client" | "customer_area"
  ) => {
    try {
      const table =
        type === "client"
          ? "client_field_settings"
          : "customer_area_field_settings";

      const { error } = await supabase
        .from(table)
        .update({ visible: !currentVisibility })
        .eq("field_name", fieldName);

      if (error) throw error;

      toast({
        title: "Campo atualizado com sucesso",
      });

      if (type === "client") {
        fetchClientFields();
      } else {
        fetchCustomerAreaFields();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar campo",
        description: error.message,
      });
    }
  };

  const handleFiscalConfigSave = async () => {
    try {
      const { error } = await supabase
        .from("fiscal_config")
        .upsert([fiscalConfig]);

      if (error) throw error;

      toast({
        title: "Configuração fiscal salva com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configuração fiscal",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    if (activeTab === "status") {
      fetchStatuses();
    } else if (activeTab === "fields") {
      fetchClientFields();
      fetchCustomerAreaFields();
    } else if (activeTab === "settings") {
      fetchFiscalConfig();
    }
  }, [activeTab, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="border-b">
        <nav className="flex space-x-4">
          <Button
            variant={activeTab === "status" ? "default" : "ghost"}
            onClick={() => setActiveTab("status")}
          >
            Status
          </Button>
          <Button
            variant={activeTab === "fields" ? "default" : "ghost"}
            onClick={() => setActiveTab("fields")}
          >
            Campos
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            onClick={() => setActiveTab("settings")}
          >
            Configurações
          </Button>
        </nav>
      </div>

      {activeTab === "status" && (
        <>
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Buscar status..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Button
              onClick={() => {
                setFormData(defaultFormData);
                setEditingId(null);
                setDialogOpen(true);
              }}
            >
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
                  <TableHead>Ativo</TableHead>
                  <TableHead>Ações</TableHead>
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
                      <TableCell>{status.name}</TableCell>
                      <TableCell>
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                      </TableCell>
                      <TableCell>{status.description}</TableCell>
                      <TableCell>{status.is_active ? "Sim" : "Não"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(status)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(status.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {activeTab === "fields" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campos do Cliente</CardTitle>
              <CardDescription>
                Configure quais campos do cliente serão visíveis no cadastro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{field.label}</span>
                    <Button
                      variant={field.visible ? "default" : "outline"}
                      onClick={() =>
                        handleToggleFieldVisibility(
                          field.field,
                          field.visible,
                          "client"
                        )
                      }
                    >
                      {field.visible ? "Visível" : "Oculto"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campos da Área do Cliente</CardTitle>
              <CardDescription>
                Configure quais campos serão visíveis na área do cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerAreaFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{field.label}</span>
                    <Button
                      variant={field.visible ? "default" : "outline"}
                      onClick={() =>
                        handleToggleFieldVisibility(
                          field.field,
                          field.visible,
                          "customer_area"
                        )
                      }
                    >
                      {field.visible ? "Visível" : "Oculto"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Fiscais</CardTitle>
              <CardDescription>
                Configure as informações fiscais para emissão de notas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="service_code" className="text-right">
                      Código de Serviço
                    </Label>
                    <Input
                      id="service_code"
                      value={fiscalConfig.service_code}
                      onChange={(e) =>
                        setFiscalConfig((prev) => ({
                          ...prev,
                          service_code: e.target.value,
                        }))
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cnae" className="text-right">
                      CNAE
                    </Label>
                    <Input
                      id="cnae"
                      value={fiscalConfig.cnae}
                      onChange={(e) =>
                        setFiscalConfig((prev) => ({
                          ...prev,
                          cnae: e.target.value,
                        }))
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tax_regime" className="text-right">
                      Regime Tributário
                    </Label>
                    <Input
                      id="tax_regime"
                      value={fiscalConfig.tax_regime}
                      onChange={(e) =>
                        setFiscalConfig((prev) => ({
                          ...prev,
                          tax_regime: e.target.value,
                        }))
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={handleFiscalConfigSave}>
                    Salvar Configurações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Status" : "Novo Status"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Cor
              </Label>
              <Input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                Descrição
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3 rounded-md border shadow-sm focus:ring focus:ring-primary focus:ring-opacity-50"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Ativo
              </Label>
              <Input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este status?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceOrderSettings;
