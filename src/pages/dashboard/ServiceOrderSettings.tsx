
import { useState } from "react";
import { StatusTab } from "./components/StatusTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import { NotasFiscaisTab } from "./components/NotasFiscaisTab";
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

  const [clientFields, setClientFields] = useState([
    { id: "1", label: "Nome", field: "name", visible: true },
    { id: "2", label: "Email", field: "email", visible: true },
    { id: "3", label: "Telefone", field: "phone", visible: true }
  ]);

  const handleFieldVisibilityChange = (fieldId: string, visible: boolean) => {
    setClientFields(fields =>
      fields.map(field =>
        field.id === fieldId ? { ...field, visible } : field
      )
    );
  };

  const handleSaveAllConfigs = async () => {
    // Implementar a lógica de salvar as configurações
    console.log("Salvando configurações...");
  };

  const renderContent = () => {
    if (location.pathname.includes("/notas-fiscais")) {
      return (
        <NotasFiscaisTab 
          fiscalConfig={fiscalConfig}
          setFiscalConfig={setFiscalConfig}
          handleSaveAllConfigs={handleSaveAllConfigs}
        />
      );
    }
    if (location.pathname.includes("/sefaz")) {
      return (
        <SEFAZTab 
          nfceConfig={nfceConfig}
          nfseConfig={nfseConfig}
          fiscalConfig={fiscalConfig}
          setNfceConfig={setNfceConfig}
          setNfseConfig={setNfseConfig}
          setFiscalConfig={setFiscalConfig}
          handleSaveAllConfigs={handleSaveAllConfigs}
        />
      );
    }
    if (location.pathname.includes("/area-cliente")) {
      return (
        <ClientTab 
          clientFields={clientFields}
          onFieldVisibilityChange={handleFieldVisibilityChange}
        />
      );
    }
    if (location.pathname.includes("/campos-visiveis")) {
      return (
        <ClientTab 
          clientFields={clientFields}
          onFieldVisibilityChange={handleFieldVisibilityChange}
        />
      );
    }
    // Default to StatusTab
    return <StatusTab />;
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
};

export default ServiceOrderSettings;
