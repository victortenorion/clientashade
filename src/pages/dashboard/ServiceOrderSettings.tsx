
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
    numero_inicial_rps: "1", // Alterado para string
    aliquota_servico: 0,
    versao_schema: "2.00",
    lote_rps_numero: 1,
    operacao_tributacao: "",
    codigo_regime_tributario: "",
    tipo_regime_especial: "",
    codigo_cidade_prestacao: "",
    usuario_emissor: "",
    senha_emissor: "",
    lote_envio_maximo: 50,
    url_provedor: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
    proxy_host: "",
    proxy_porta: "",
    proxy_usuario: "",
    proxy_senha: "",
    numero_lote: 1,
    usar_certificado_gov: false,
    caminho_certificado_gov: "",
    senha_certificado_gov: "",
    rps_tipo: "RPS",
    rps_serie: "1",
    tipo_contribuinte: "1",
    gerar_prazos_aceite: false,
    prazo_aceite_dias: 0,
    tipo_documento_prestador: "CNPJ",
    enviar_email_tomador: true,
    alerta_envio_email: true,
    substituir_nfse: false,
    substituida_numero: "",
    substituida_serie: "",
    usar_tributacao_aproximada: false,
    percentual_tributos_aproximado: 0,
    local_servico: "prestador",
    tipo_documento_tomador: "CNPJ",
    padrao_prefeitura: "PREFEITURA DE SAO PAULO",
    gerar_guia_pagamento: false,
    codigo_servico_municipio: "",
    fonte_tributos: "I",
    natureza_operacao: "1",
    descricao_servico_padrao: ""
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

    // Verificar qual conteúdo mostrar baseado no path
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
