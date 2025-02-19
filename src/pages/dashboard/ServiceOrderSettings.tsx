import { useState, useEffect } from "react";
import { StatusTab } from "./components/StatusTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import { NotasFiscaisTab } from "./components/NotasFiscaisTab";
import { CompanyInfoTab } from "./components/CompanyInfoTab";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { NFCeConfig, NFSeConfig, FiscalConfig } from "./types/config.types";

const ServiceOrderSettings = () => {
  const location = useLocation();
  const { toast } = useToast();

  const [nfceConfig, setNfceConfig] = useState<NFCeConfig>({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    regime_tributario: "",
    inscricao_estadual: "",
    token_ibpt: "",
    csc_token: "",
    csc_id: "",
    certificado_valido: false,
    certificado_validade: undefined
  });

  const [nfseConfig, setNfseConfig] = useState<NFSeConfig>({
    certificado_digital: "",
    senha_certificado: "",
    ambiente: "homologacao",
    regime_tributario: "",
    regime_especial: "",
    inscricao_municipal: "",
    codigo_municipio: "",
    incentivo_fiscal: false,
    certificado_valido: false,
    certificado_validade: undefined,
    numero_inicial_rps: "1",
    aliquota_servico: 0,
    serie_rps_padrao: "RPS",
    tipo_rps: "RPS",
    padrao_prefeitura: "PREFEITURA DE SAO PAULO",
    url_homologacao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
    url_producao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
    lote_rps_numero: 1,
    versao_schema: "2.00",
    operacao_tributacao: "",
    codigo_regime_tributario: "",
    tipo_regime_especial: "",
    codigo_cidade_prestacao: "",
    usuario_emissor: "",
    senha_emissor: "",
    lote_envio_maximo: 50,
    url_provedor: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx"
  });

  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>({
    service_code: "",
    cnae: "",
    tax_regime: ""
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const { data: nfceData, error: nfceError } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'nfce')
        .maybeSingle();

      if (nfceError) {
        console.error('Erro ao carregar configurações NFC-e:', nfceError);
      }

      const { data: nfseData, error: nfseError } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'nfse')
        .maybeSingle();

      if (nfseError) {
        console.error('Erro ao carregar configurações NFS-e:', nfseError);
      }

      const { data: generalData, error: generalError } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'general')
        .maybeSingle();

      if (generalError) {
        console.error('Erro ao carregar configurações gerais:', generalError);
      }

      if (nfceData?.config) {
        setNfceConfig(prevConfig => ({
          ...prevConfig,
          ...nfceData.config
        }));
      }

      if (nfseData?.config) {
        setNfseConfig(prevConfig => ({
          ...prevConfig,
          ...nfseData.config
        }));
      }

      if (generalData?.config) {
        setFiscalConfig(prevConfig => ({
          ...prevConfig,
          ...generalData.config
        }));
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
      const { error: nfceError } = await supabase
        .from('fiscal_config')
        .upsert({
          type: 'nfce',
          config: nfceConfig
        }, {
          onConflict: 'type'
        });

      if (nfceError) throw nfceError;

      const { error: nfseError } = await supabase
        .from('fiscal_config')
        .upsert({
          type: 'nfse',
          config: nfseConfig
        }, {
          onConflict: 'type'
        });

      if (nfseError) throw nfseError;

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
    const path = location.pathname;

    if (path.includes("/notas-fiscais")) {
      return <NotasFiscaisTab />;
    }
    if (path.includes("/dados-empresa")) {
      return <CompanyInfoTab />;
    }
    if (path.includes("/sefaz")) {
      return (
        <SEFAZTab 
          nfceConfig={nfceConfig}
          nfseConfig={nfseConfig}
          fiscalConfig={fiscalConfig}
          setNfceConfig={(config: NFCeConfig) => setNfceConfig(config)}
          setNfseConfig={(config: NFSeConfig) => setNfseConfig(config)}
          setFiscalConfig={(config: FiscalConfig) => setFiscalConfig(config)}
          handleSaveAllConfigs={handleSaveAllConfigs}
        />
      );
    }
    if (path.includes("/area-cliente") || path.includes("/campos-visiveis")) {
      return <ClientTab />;
    }
    return <StatusTab />;
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
};

export default ServiceOrderSettings;
