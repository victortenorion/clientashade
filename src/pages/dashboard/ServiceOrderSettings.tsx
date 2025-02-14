
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { StatusTab } from "./components/StatusTab";
import { NotasFiscaisTab } from "./components/NotasFiscaisTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import PersonalizarTab from "./components/PersonalizarTab";

const ServiceOrderSettings = () => {
  const location = useLocation();
  const currentPath = location.pathname.split("/").pop() || "status";

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
    console.log("Salvando configurações...");
  };

  // Renderiza o componente apropriado baseado na rota atual
  const renderContent = () => {
    switch (currentPath) {
      case "personalizar":
        return <PersonalizarTab />;
      case "notas-fiscais":
        return <NotasFiscaisTab />;
      case "sefaz":
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
      case "area-cliente":
        return <ClientTab />;
      default:
        return <StatusTab />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {currentPath === "status" ? "Configurações" : currentPath.charAt(0).toUpperCase() + currentPath.slice(1).replace(/-/g, " ")}
        </h2>
        <p className="text-muted-foreground">
          Configure as opções do sistema
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

export default ServiceOrderSettings;
