
import { useState } from "react";
import { StatusTab } from "./components/StatusTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import { NotasFiscaisTab } from "./components/NotasFiscaisTab";
import { CompanyInfoTab } from "./components/CompanyInfoTab";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const ServiceOrderSettings = () => {
  const location = useLocation();
  const { toast } = useToast();

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
    try {
      // Implementar a lógica de salvar as configurações
      console.log("Salvando configurações...");
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações",
        variant: "destructive"
      });
    }
  };

  const renderContent = () => {
    if (location.pathname.includes("/notas-fiscais")) {
      return (
        <NotasFiscaisTab />
      );
    }
    if (location.pathname.includes("/dados-empresa")) {
      return (
        <CompanyInfoTab />
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
