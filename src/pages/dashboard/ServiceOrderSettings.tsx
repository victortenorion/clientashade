
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { StatusTab } from "./components/StatusTab";
import { NotasFiscaisTab } from "./components/NotasFiscaisTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import PersonalizarTab from "./components/PersonalizarTab";

const ServiceOrderSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname.split("/").pop() || "status";

  const [nfceConfig, setNfceConfig] = useState({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    token_ibpt: "",
    csc_id: "",
    csc_token: "",
    inscricao_estadual: "",
    regime_tributario: "",
  });

  const [nfseConfig, setNfseConfig] = useState({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    inscricao_municipal: "",
    codigo_municipio: "",
    regime_tributario: "",
    regime_especial: "",
    incentivo_fiscal: false,
  });

  const [fiscalConfig, setFiscalConfig] = useState({
    service_code: "",
    cnae: "",
    tax_regime: "",
  });

  const handleSaveAllConfigs = async () => {
    // Implementar a lógica de salvar as configurações
    console.log("Salvando configurações...");
  };

  const handleTabChange = (value: string) => {
    if (value === "status") {
      navigate("/dashboard/service-order-settings");
    } else {
      navigate(`/dashboard/service-order-settings/${value}`);
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="personalizar">Personalizar</TabsTrigger>
        <TabsTrigger value="notas-fiscais">Notas Fiscais</TabsTrigger>
        <TabsTrigger value="sefaz">SEFAZ</TabsTrigger>
        <TabsTrigger value="area-cliente">Área do Cliente</TabsTrigger>
      </TabsList>
      <TabsContent value="status">
        <StatusTab />
      </TabsContent>
      <TabsContent value="personalizar">
        <PersonalizarTab />
      </TabsContent>
      <TabsContent value="notas-fiscais">
        <NotasFiscaisTab />
      </TabsContent>
      <TabsContent value="sefaz">
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
      <TabsContent value="area-cliente">
        <ClientTab />
      </TabsContent>
    </Tabs>
  );
};

export default ServiceOrderSettings;
