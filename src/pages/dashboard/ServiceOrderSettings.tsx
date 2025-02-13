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
  const [fiscalConfig, setFiscalConfig] = useState({
    service_code: "",
    cnae: "",
    tax_regime: "simples"
  });
  const [serviceCodeSearch, setServiceCodeSearch] = useState("");
  const [serviceCodes, setServiceCodes] = useState<Array<{ code: string; description: string }>>([]);
  const [serviceCodePopoverOpen, setServiceCodePopoverOpen] = useState(false);

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
      const { data: nfceData, error: nfceError } = await supabase
        .from("nfce_config")
        .select("*")
        .maybeSingle();

      if (nfceError) throw nfceError;
      if (nfceData) setNfceConfig(nfceData);

      const { data: nfseData, error: nfseError } = await supabase
        .from("nfse_config")
        .select("*")
        .maybeSingle();

      if (nfseError) throw nfseError;
      if (nfseData) setNfseConfig(nfseData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações fiscais",
        description: error.message,
      });
    }
  };

  const fetchFiscalConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("fiscal_config")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (data) setFiscalConfig(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações fiscais",
        description: error.message,
      });
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
        .upsert(fiscalConfig);

      if (error) throw error;

      toast({
        title: "Configurações fiscais salvas com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações fiscais",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    fetchStatuses();
    fetchFieldSettings();
    fetchNFConfigs();
    fetchFiscalConfig();
    fetchServiceCodes();
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
            <TabsTrigger value="fiscal" className="data-[state=active]:bg-background rounded-none h-12 px-6">
              <Receipt className="h-4 w-4 mr-2" />
              Notas Fiscais
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

          <TabsContent value="fiscal" className="mt-6">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Códigos e Tributos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código do Serviço (LC 116)</Label>
                    <Popover open={serviceCodePopoverOpen} onOpenChange={setServiceCodePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={serviceCodePopoverOpen}
                          className="w-full justify-between"
                        >
                          {fiscalConfig.service_code
                            ? serviceCodes.find((item) => item.code === fiscalConfig.service_code)?.code || fiscalConfig.service_code
                            : "Selecione o código do serviço..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar código de serviço..."
                            value={serviceCodeSearch}
                            onValueChange={setServiceCodeSearch}
                          />
                          <CommandEmpty>Nenhum código encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-auto">
                            {(serviceCodes || []).map((item) => (
                              <CommandItem
                                key={item.code}
                                value={item.code}
                                onSelect={(value) => {
                                  setFiscalConfig(prev => ({
                                    ...prev,
                                    service_code: value
                                  }));
                                  setServiceCodePopoverOpen(false);
                                }}
                              >
                                <span className="font-medium">{item.code}</span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {item.description}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {fiscalConfig.service_code && serviceCodes.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {serviceCodes.find((item) => item.code === fiscalConfig.service_code)?.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>CNAE</Label>
                    <Input
                      value={fiscalConfig?.cnae || ""}
                      onChange={(e) => setFiscalConfig(prev => ({
                        ...prev,
                        cnae: e.target.value
                      }))}
                      placeholder="Ex: 9512-6/00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Regime Tributário</Label>
                    <Select
                      value={fiscalConfig?.tax_regime || "simples"}
                      onValueChange={(value) => setFiscalConfig(prev => ({
                        ...prev,
                        tax_regime: value
                      }))}
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
                <Button onClick={handleFiscalConfigSave}>Salvar Configurações Fiscais</Button>
              </div>

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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Inscrição Municipal</Label>
                    <Input
                      value={nfseConfig.inscricao_municipal}
                      onChange={(e) => setNfseConfig(prev => ({ ...prev, inscricao_municipal: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código do Município</Label>
                    <Input
                      value={nfseConfig.codigo_municipio}
                      onChange={(e) => setNfseConfig(prev => ({ ...prev, codigo_municipio: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Regime Tributário</Label>
                    <Select
                      value={nfseConfig.regime_tributario}
                      onValueChange={(value) => setNfseConfig(prev => ({ ...prev, regime_tributario: value }))}
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
                  <div className="space-y-2">
                    <Label>Regime Especial</Label>
                    <Input
                      value={nfseConfig.regime_especial}
                      onChange={(e) => setNfseConfig(prev => ({ ...prev, regime_especial: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incentivo_fiscal"
                      checked={nfseConfig.incentivo_fiscal}
                      onCheckedChange={(checked) => 
                        setNfseConfig(prev => ({ ...prev, incentivo_fiscal: checked as boolean }))
                      }
                    />
                    <Label htmlFor="incentivo_fiscal">Possui Incentivo Fiscal</Label>
                  </div>
                </div>
                <Button onClick={handleNFSeConfigSave}>Salvar Configurações NFS-e</Button>
              </div>
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
