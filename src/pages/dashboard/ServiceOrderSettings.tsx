import { useState, useEffect, useMemo } from "react";
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
import { Plus, Trash2, Pencil, Settings2, Users, Receipt, ListFilter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

interface FiscalConfig {
  id?: string;
  service_code: string;
  cnae: string;
  tax_regime: string;
}

interface CustomerAreaField {
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

const defaultCustomerAreaFields: CustomerAreaField[] = [
  { id: "1", label: "Número da OS", field: "order_number", visible: true },
  { id: "2", label: "Data de Criação", field: "created_at", visible: true },
  { id: "3", label: "Status", field: "status", visible: true },
  { id: "4", label: "Prioridade", field: "priority", visible: true },
  { id: "5", label: "Equipamento", field: "equipment", visible: true },
  { id: "6", label: "Número de Série", field: "equipment_serial_number", visible: true },
  { id: "7", label: "Problema Relatado", field: "problem", visible: true },
  { id: "8", label: "Descrição do Serviço", field: "description", visible: true },
  { id: "9", label: "Previsão de Conclusão", field: "expected_date", visible: true },
  { id: "10", label: "Data de Conclusão", field: "completion_date", visible: true },
  { id: "11", label: "Data de Saída", field: "exit_date", visible: true },
  { id: "12", label: "Valor Total", field: "total_price", visible: true },
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
  const [nfceConfig, setNfceConfig] = useState({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    token_ibpt: "",
    csc_id: "",
    csc_token: "",
    inscricao_estadual: "",
    regime_tributario: "simples"
  });
  const [nfseConfig, setNfseConfig] = useState({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    inscricao_municipal: "",
    codigo_municipio: "",
    regime_tributario: "simples",
    regime_especial: "",
    incentivo_fiscal: false
  });
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>({
    service_code: "",
    cnae: "",
    tax_regime: "simples"
  });
  const [serviceCodeSearch, setServiceCodeSearch] = useState("");
  const [serviceCodes, setServiceCodes] = useState<Array<{ code: string; description: string }>>([]);
  const [serviceCodePopoverOpen, setServiceCodePopoverOpen] = useState(false);
  const [customerAreaFields, setCustomerAreaFields] = useState<CustomerAreaField[]>(defaultCustomerAreaFields);

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

  const fetchNFConfigs = async () => {
    try {
      setLoading(true);
      // Buscar configurações NFCe
      const { data: nfceData, error: nfceError } = await supabase
        .from("nfce_config")
        .select("*")
        .maybeSingle();

      if (nfceError) throw nfceError;
      
      // Se encontrou dados da NFCe, atualiza o estado
      if (nfceData) {
        setNfceConfig({
          certificado_digital: nfceData.certificado_digital || "",
          senha_certificado: nfceData.senha_certificado || "",
          ambiente: nfceData.ambiente || "homologacao",
          token_ibpt: nfceData.token_ibpt || "",
          csc_id: nfceData.csc_id || "",
          csc_token: nfceData.csc_token || "",
          inscricao_estadual: nfceData.inscricao_estadual || "",
          regime_tributario: nfceData.regime_tributario || "simples"
        });
      }

      // Buscar configurações NFSe
      const { data: nfseData, error: nfseError } = await supabase
        .from("nfse_config")
        .select("*")
        .maybeSingle();

      if (nfseError) throw nfseError;
      
      // Se encontrou dados da NFSe, atualiza o estado
      if (nfseData) {
        setNfseConfig({
          certificado_digital: nfseData.certificado_digital || "",
          senha_certificado: nfseData.senha_certificado || "",
          ambiente: nfseData.ambiente || "homologacao",
          inscricao_municipal: nfseData.inscricao_municipal || "",
          codigo_municipio: nfseData.codigo_municipio || "",
          regime_tributario: nfseData.regime_tributario || "simples",
          regime_especial: nfseData.regime_especial || "",
          incentivo_fiscal: nfseData.incentivo_fiscal || false
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações fiscais",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFiscalConfig = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from("fiscal_config")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        // If no record exists, create a default one
        const { data: newData, error: insertError } = await supabase
          .from("fiscal_config")
          .insert({
            service_code: "",
            cnae: "",
            tax_regime: "simples"
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }
      
      if (data) {
        setFiscalConfig({
          id: data.id,
          service_code: data.service_code || "",
          cnae: data.cnae || "",
          tax_regime: data.tax_regime || "simples"
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações fiscais:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações fiscais",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("lc116_service_codes")
        .select("code, description")
        .order('code');

      if (error) throw error;
      if (data) setServiceCodes(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar códigos de serviço",
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
        .from('client_field_settings')
        .upsert(
          { 
            field_name: field,
            visible: checked,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'field_name' }
        );

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

  const handleNFCeConfigSave = async () => {
    try {
      const { error } = await supabase
        .from("nfce_config")
        .upsert(nfceConfig);

      if (error) throw error;

      toast({
        title: "Configurações da NFC-e salvas com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações da NFC-e",
        description: error.message,
      });
    }
  };

  const handleNFSeConfigSave = async () => {
    try {
      const { error } = await supabase
        .from("nfse_config")
        .upsert(nfseConfig);

      if (error) throw error;

      toast({
        title: "Configurações da NFS-e salvas com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações da NFS-e",
        description: error.message,
      });
    }
  };

  const handleFiscalConfigSave = async () => {
    try {
      const { error } = await supabase
        .from("fiscal_config")
        .upsert({
          service_code: fiscalConfig.service_code,
          cnae: fiscalConfig.cnae,
          tax_regime: fiscalConfig.tax_regime,
          id: fiscalConfig?.id,
        }, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: "Configurações fiscais salvas com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações fiscais",
        description: error.message,
      });
    }
  };

  const handleSaveAllConfigs = async () => {
    try {
      // Salva configurações fiscais
      const { error: fiscalError } = await supabase
        .from("fiscal_config")
        .upsert({
          service_code: fiscalConfig.service_code,
          cnae: fiscalConfig.cnae,
          tax_regime: fiscalConfig.tax_regime,
          id: fiscalConfig?.id
        }, { 
          onConflict: 'id'
        });

      if (fiscalError) throw fiscalError;

      // Salva configurações NFCe
      const { error: nfceError } = await supabase
        .from("nfce_config")
        .upsert(nfceConfig);

      if (nfceError) throw nfceError;

      // Salva configurações NFSe
      const { error: nfseError } = await supabase
        .from("nfse_config")
        .upsert(nfseConfig);

      if (nfseError) throw nfseError;

      toast({
        title: "Configurações salvas com sucesso",
      });

      // Recarrega todas as configurações após salvar
      await Promise.all([
        fetchFiscalConfig(),
        fetchNFConfigs()
      ]);
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message,
      });
    }
  };

  const fetchCustomerAreaSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_area_field_settings")
        .select("*");

      if (error) throw error;

      if (data) {
        const updatedFields = customerAreaFields.map(field => ({
          ...field,
          visible: data.find(setting => setting.field_name === field.field)?.visible ?? field.visible
        }));
        setCustomerAreaFields(updatedFields);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações da área do cliente",
        description: error.message,
      });
    }
  };

  const handleCustomerAreaFieldVisibilityChange = async (field: string, checked: boolean) => {
    try {
      const { error } = await supabase
        .from('customer_area_field_settings')
        .upsert(
          { 
            field_name: field,
            visible: checked,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'field_name' }
        );

      if (error) throw error;

      setCustomerAreaFields(prev => 
        prev.map(f => 
          f.field === field ? { ...f, visible: checked } : f
        )
      );

      toast({
        title: "Configuração salva",
        description: `Campo ${field} ${checked ? 'será exibido' : 'será ocultado'} na área do cliente`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configuração",
        description: error.message,
      });
    }
  };

  // Carregar todas as configurações ao montar o componente
  useEffect(() => {
    Promise.all([
      fetchStatuses(),
      fetchFieldSettings(),
      fetchNFConfigs(),
      fetchFiscalConfig(),
      fetchServiceCodes(),
      fetchCustomerAreaSettings()
    ]);
  }, []);

  const filteredServiceCodes = useMemo(() => {
    return serviceCodeSearch === "" 
      ? serviceCodes 
      : serviceCodes.filter((item) => {
          const search = serviceCodeSearch.toLowerCase();
          return (
            item.code.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search)
          );
        });
  }, [serviceCodes, serviceCodeSearch]);

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
            <TabsTrigger value="customer_area" className="data-[state=active]:bg-background rounded-none h-12 px-6">
              <Users className="h-4 w-4 mr-2" />
              Área do Cliente
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="data-[state=active]:bg-background rounded-none h-12 px-6">
              <Receipt className="h-4 w-4 mr-2" />
              Notas Fiscais
            </TabsTrigger>
            <TabsTrigger value="sefaz" className="data-[state=active]:bg-background rounded-none h-12 px-6">
              <ListFilter className="h-4 w-4 mr-2" />
              SEFAZ
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

          <TabsContent value="customer_area" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Campos Visíveis na Área do Cliente</h3>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    {customerAreaFields.map((field) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={field.id}
                          checked={customerAreaFields.find(f => f.field === field.field)?.visible ?? field.visible}
                          onCheckedChange={(checked) => 
                            handleCustomerAreaFieldVisibilityChange(field.field, checked as boolean)
                          }
                        />
                        <Label htmlFor={field.id}>{field.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecione os campos que deseja exibir na área do cliente. As alterações serão salvas automaticamente.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fiscal" className="mt-6">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações NFC-e</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Certificado Digital (Base64)</Label>
                    <Textarea
                      value={nfceConfig.certificado_digital}
                      onChange={(e) => setNfceConfig(prev => ({ ...prev, certificado_digital: e.target.value }))}
                      placeholder="Cole aqui o certificado em base64"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha do Certificado</Label>
                    <Input
                      type="password"
                      value={nfceConfig.senha_certificado}
                      onChange={(e) => setNfceConfig(prev => ({ ...prev, senha_certificado: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={nfceConfig.ambiente}
                      onValueChange={(value) => setNfceConfig(prev => ({ ...prev, ambiente: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Token IBPT</Label>
                    <Input
                      value={nfceConfig.token_ibpt}
                      onChange={(e) => setNfceConfig(prev => ({ ...prev, token_ibpt: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CSC ID</Label>
                    <Input
                      value={nfceConfig.csc_id}
                      onChange={(e) => setNfceConfig(prev => ({ ...prev, csc_id: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Token CSC</Label>
                    <Input
                      value={nfceConfig.csc_token}
                      onChange={(e) => setNfceConfig(prev => ({ ...prev, csc_token: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inscrição Estadual</Label>
                    <Input
                      value={nfceConfig.inscricao_estadual}
                      onChange={(e) => setNfceConfig(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Regime Tributário</Label>
                    <Select
                      value={nfceConfig.regime_tributario}
                      onValueChange={(value) => setNfceConfig(prev => ({ ...prev, regime_tributario: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples">Simples Nacional</SelectItem>
                        <SelectItem value="presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="real">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleNFCeConfigSave}>Salvar Configurações NFC-e</Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações NFS-e</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Certificado Digital (Base64)</Label>
                    <Textarea
                      value={nfseConfig.certificado_digital}
                      onChange={(e) => setNfseConfig(prev => ({ ...prev, certificado_digital: e.target.value }))}
                      placeholder="Cole aqui o certificado em base64"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha do Certificado</Label>
                    <Input
                      type="password"
                      value={nfseConfig.senha_certificado}
                      onChange={(e) => setNfseConfig(prev => ({ ...prev, senha_certificado: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={nfseConfig.ambiente}
                      onValueChange={(value) => setNfseConfig(prev => ({ ...prev, ambiente: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
