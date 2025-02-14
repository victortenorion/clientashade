
import { useState, useEffect } from "react";
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

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Carregar configurações NFC-e
      const { data: nfceData, error: nfceError } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'nfce')
        .single();

      if (nfceError && nfceError.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações NFC-e:', nfceError);
      }

      // Carregar configurações NFS-e
      const { data: nfseData, error: nfseError } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'nfse')
        .single();

      if (nfseError && nfseError.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações NFS-e:', nfseError);
      }

      // Carregar configurações fiscais gerais
      const { data: generalData, error: generalError } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'general')
        .single();

      if (generalError && generalError.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações gerais:', generalError);
      }

      if (nfceData) {
        setNfceConfig({
          ...nfceConfig,
          ...nfceData.config,
        });
      }

      if (nfseData) {
        setNfseConfig({
          ...nfseConfig,
          ...nfseData.config,
        });
      }

      if (generalData) {
        setFiscalConfig({
          ...fiscalConfig,
          ...generalData.config,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar as configurações",
        variant: "destructive"
      });
    }
  };

  const handleSaveAllConfigs = async () => {
    try {
      // Salvar configurações NFC-e
      const { error: nfceError } = await supabase
        .from('fiscal_config')
        .upsert({
          type: 'nfce',
          config: nfceConfig
        }, {
          onConflict: 'type'
        });

      if (nfceError) throw nfceError;

      // Salvar configurações NFS-e
      const { error: nfseError } = await supabase
        .from('fiscal_config')
        .upsert({
          type: 'nfse',
          config: nfseConfig
        }, {
          onConflict: 'type'
        });

      if (nfseError) throw nfseError;

      // Salvar configurações fiscais gerais
      const { error: fiscalError } = await supabase
        .from('fiscal_config')
        .upsert({
          type: 'general',
          config: fiscalConfig
        }, {
          onConflict: 'type'
        });

      if (fiscalError) throw fiscalError;
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });

      // Recarregar as configurações após salvar
      await loadConfigurations();
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
      return <NotasFiscaisTab />;
    }
    if (location.pathname.includes("/dados-empresa")) {
      return <CompanyInfoTab />;
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
