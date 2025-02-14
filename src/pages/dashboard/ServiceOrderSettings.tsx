import { useState, useEffect } from "react";
import { Settings2, Users, Receipt, ListFilter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatusTab } from "./components/StatusTab";
import {
  Status,
  ClientField,
  FiscalConfig,
  CustomerAreaField,
  NFCeConfig,
  NFSeConfig
} from "./types/service-order-settings.types";
import { ClientTab } from "./components/ClientTab";
import { CustomerAreaTab } from "./components/CustomerAreaTab";
import { FiscalTab } from "./components/FiscalTab";
import { SEFAZTab } from "./components/SEFAZTab";

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
  const { toast } = useToast();
  const [clientFields, setClientFields] = useState<ClientField[]>(defaultClientFields);
  const [customerAreaFields, setCustomerAreaFields] = useState<CustomerAreaField[]>(defaultCustomerAreaFields);
  const [nfceConfig, setNfceConfig] = useState<NFCeConfig>({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    token_ibpt: "",
    csc_id: "",
    csc_token: "",
    inscricao_estadual: "",
    regime_tributario: "simples"
  });
  const [nfseConfig, setNfseConfig] = useState<NFSeConfig>({
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

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_order_statuses")
        .select("*")
        .order("created_at", { ascending: true });

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

  const handleStatusSave = async (status: Partial<Status>) => {
    try {
      if ('id' in status) {
        const { error } = await supabase
          .from("service_order_statuses")
          .update(status)
          .eq("id", status.id);

        if (error) throw error;

        toast({
          title: "Status atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("service_order_statuses")
          .insert(status);

        if (error) throw error;

        toast({
          title: "Status criado com sucesso",
        });
      }

      fetchStatuses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar status",
        description: error.message,
      });
    }
  };

  const handleStatusDelete = async (id: string) => {
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

  const fetchClientFieldSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("client_field_settings")
        .select("*");

      if (error) throw error;

      if (data) {
        const updatedFields = defaultClientFields.map(field => ({
          ...field,
          visible: data.find(setting => setting.field_name === field.field)?.visible ?? field.visible
        }));
        setClientFields(updatedFields);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações dos campos do cliente",
        description: error.message,
      });
    }
  };

  const handleClientFieldVisibilityChange = async (field: string, checked: boolean) => {
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
        description: `Campo ${field} ${checked ? 'será exibido' : 'será ocultado'} na listagem de clientes`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configuração",
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
        const updatedFields = defaultCustomerAreaFields.map(field => ({
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

  const handleNFCeConfigSave = async (config: NFCeConfig) => {
    try {
      const { error } = await supabase
        .from("nfce_config")
        .upsert(config);

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

  const handleNFSeConfigSave = async (config: NFSeConfig) => {
    try {
      const { error } = await supabase
        .from("nfse_config")
        .upsert(config);

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

  const handleFiscalConfigSave = async (config: FiscalConfig) => {
    try {
      const { error } = await supabase
        .from("fiscal_config")
        .upsert({
          service_code: config.service_code,
          cnae: config.cnae,
          tax_regime: config.tax_regime,
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

  useEffect(() => {
    Promise.all([
      fetchStatuses(),
      fetchClientFieldSettings(),
      fetchCustomerAreaSettings(),
      fetchNFConfigs(),
      fetchFiscalConfig(),
      fetchServiceCodes()
    ]);
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
            <StatusTab
              statuses={statuses}
              loading={loading}
              onDelete={handleStatusDelete}
              onSave={handleStatusSave}
            />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientTab
              clientFields={clientFields}
              onFieldVisibilityChange={handleClientFieldVisibilityChange}
            />
          </TabsContent>

          <TabsContent value="customer_area" className="mt-6">
            <CustomerAreaTab
              customerAreaFields={customerAreaFields}
              onFieldVisibilityChange={handleCustomerAreaFieldVisibilityChange}
            />
          </TabsContent>

          <TabsContent value="fiscal" className="mt-6">
            <FiscalTab
              nfceConfig={nfceConfig}
              nfseConfig={nfseConfig}
              fiscalConfig={fiscalConfig}
              serviceCodes={serviceCodes}
              serviceCodeSearch={serviceCodeSearch}
              setServiceCodeSearch={setServiceCodeSearch}
              setNfceConfig={setNfceConfig}
              setNfseConfig={setNfseConfig}
              setFiscalConfig={setFiscalConfig}
              fetchServiceCodes={fetchServiceCodes}
              handleNFCeConfigSave={handleNFCeConfigSave}
              handleNFSeConfigSave={handleNFSeConfigSave}
              handleFiscalConfigSave={handleFiscalConfigSave}
              handleSaveAllConfigs={handleSaveAllConfigs}
            />
          </TabsContent>

          <TabsContent value="sefaz" className="mt-6">
            <SEFAZTab
              nfceConfig={nfceConfig}
              nfseConfig={nfseConfig}
              fiscalConfig={fiscalConfig}
              setNfceConfig={setNfceConfig}
              setNfseConfig={setNfseConfig}
              setFiscalConfig={setFiscalConfig}
              handleSaveAllConfigs={handleSaveAllConfigs}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceOrderSettings;
