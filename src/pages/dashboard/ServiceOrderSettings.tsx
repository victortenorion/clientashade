
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusTab } from "./components/StatusTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ClientField } from "./types/service-order-settings.types";

const ServiceOrderSettings = () => {
  const location = useLocation();

  const [nfceConfig, setNfceConfig] = useState({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    regime_tributario: "",
    inscricao_estadual: "",
    token_ibpt: "",
    csc_token: "",
    csc_id: ""
  });

  const [nfseConfig, setNfseConfig] = useState({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    regime_tributario: "",
    regime_especial: "",
    inscricao_municipal: "",
    codigo_municipio: "",
    incentivo_fiscal: false
  });

  const [fiscalConfig, setFiscalConfig] = useState({
    service_code: "",
    cnae: "",
    tax_regime: ""
  });

  const [clientFields, setClientFields] = useState<ClientField[]>([
    { id: "1", field_name: "Nome", visible: true },
    { id: "2", field_name: "Email", visible: true },
    { id: "3", field_name: "Telefone", visible: true }
  ]);

  const handleFieldVisibilityChange = (fieldId: string, visible: boolean) => {
    setClientFields(fields =>
      fields.map(field =>
        field.id === fieldId ? { ...field, visible } : field
      )
    );
  };

  const getDefaultTab = () => {
    if (location.pathname.includes("/sefaz")) return "sefaz";
    if (location.pathname.includes("/notas-fiscais")) return "notas-fiscais";
    if (location.pathname.includes("/area-cliente")) return "area-cliente";
    if (location.pathname.includes("/campos-visiveis")) return "campos-visiveis";
    return "status";
  };

  return (
    <Tabs defaultValue={getDefaultTab()} className="space-y-6">
      <TabsList>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="notas-fiscais">Notas Fiscais</TabsTrigger>
        <TabsTrigger value="sefaz">SEFAZ</TabsTrigger>
        <TabsTrigger value="area-cliente">Área do Cliente</TabsTrigger>
        <TabsTrigger value="campos-visiveis">Campos Visíveis</TabsTrigger>
      </TabsList>

      <TabsContent value="status">
        <StatusTab />
      </TabsContent>
      <TabsContent value="notas-fiscais">
        <SEFAZTab 
          nfceConfig={nfceConfig}
          nfseConfig={nfseConfig}
          fiscalConfig={fiscalConfig}
          setNfceConfig={setNfceConfig}
          setNfseConfig={setNfseConfig}
          setFiscalConfig={setFiscalConfig}
        />
      </TabsContent>
      <TabsContent value="sefaz">
        <SEFAZTab 
          nfceConfig={nfceConfig}
          nfseConfig={nfseConfig}
          fiscalConfig={fiscalConfig}
          setNfceConfig={setNfceConfig}
          setNfseConfig={setNfseConfig}
          setFiscalConfig={setFiscalConfig}
        />
      </TabsContent>
      <TabsContent value="area-cliente">
        <ClientTab 
          clientFields={clientFields}
          onFieldVisibilityChange={handleFieldVisibilityChange}
        />
      </TabsContent>
      <TabsContent value="campos-visiveis">
        <ClientTab 
          clientFields={clientFields}
          onFieldVisibilityChange={handleFieldVisibilityChange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ServiceOrderSettings;
