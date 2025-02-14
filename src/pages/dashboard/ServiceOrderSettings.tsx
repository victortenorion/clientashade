
import { useState } from "react";
import { StatusTab } from "./components/StatusTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import { NotasFiscaisTab } from "./components/NotasFiscaisTab";
import { useLocation } from "react-router-dom";

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
    if (location.pathname.includes("/area-cliente") || location.pathname.includes("/campos-visiveis")) {
      return <ClientTab />;
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
