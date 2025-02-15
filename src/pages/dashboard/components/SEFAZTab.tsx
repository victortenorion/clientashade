
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface NFCeConfig {
  certificado_digital: string;
  senha_certificado: string;
  ambiente: string;
  token_ibpt: string;
  csc_id: string;
  csc_token: string;
  inscricao_estadual: string;
  regime_tributario: string;
  certificado_valido?: boolean;
  certificado_validade?: string;
}

interface NFSeConfig {
  certificado_digital: string;
  senha_certificado: string;
  ambiente: string;
  inscricao_municipal: string;
  codigo_municipio: string;
  regime_tributario: string;
  regime_especial: string;
  incentivo_fiscal: boolean;
  certificado_valido?: boolean;
  certificado_validade?: string;
  numero_inicial_rps?: number;
  aliquota_servico?: number;
  versao_schema?: string;
  lote_rps_numero?: number;
  operacao_tributacao?: string;
  codigo_regime_tributario?: string;
  tipo_regime_especial?: string;
}

interface FiscalConfig {
  service_code: string;
  cnae: string;
  tax_regime: string;
}

interface SEFAZTabProps {
  nfceConfig: NFCeConfig;
  nfseConfig: NFSeConfig;
  fiscalConfig: FiscalConfig;
  setNfceConfig: (config: NFCeConfig) => void;
  setNfseConfig: (config: NFSeConfig) => void;
  setFiscalConfig: (config: FiscalConfig) => void;
  handleSaveAllConfigs: () => void;
}

export const SEFAZTab: React.FC<SEFAZTabProps> = ({
  nfceConfig,
  nfseConfig,
  fiscalConfig,
  setNfceConfig,
  setNfseConfig,
  setFiscalConfig,
  handleSaveAllConfigs,
}) => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [selectedTab, setSelectedTab] = useState("nfse");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCertificate();
  }, [selectedTab]);

  const loadCertificate = async () => {
    try {
      const { data: certificate, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('type', selectedTab)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Não encontrado
          console.error('Erro ao carregar certificado:', error);
          toast({
            title: "Erro",
            description: "Erro ao carregar certificado do banco de dados",
            variant: "destructive"
          });
        }
        return;
      }

      if (certificate) {
        if (selectedTab === 'nfse') {
          setNfseConfig({
            ...nfseConfig,
            certificado_digital: certificate.certificate_data,
            senha_certificado: certificate.certificate_password,
            certificado_valido: certificate.is_valid,
            certificado_validade: certificate.valid_until
          });
        } else {
          setNfceConfig({
            ...nfceConfig,
            certificado_digital: certificate.certificate_data,
            senha_certificado: certificate.certificate_password,
            certificado_valido: certificate.is_valid,
            certificado_validade: certificate.valid_until
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar certificado:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/x-pkcs12' && !file.name.endsWith('.pfx')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de certificado digital válido (.pfx)",
        variant: "destructive"
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const binaryStr = e.target?.result;
        if (!binaryStr) return;

        const base64 = btoa(
          new Uint8Array(binaryStr as ArrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        console.log("Tamanho do certificado em base64:", base64.length);

        if (selectedTab === 'nfse') {
          setNfseConfig({
            ...nfseConfig,
            certificado_digital: base64
          });
        } else {
          setNfceConfig({
            ...nfceConfig,
            certificado_digital: base64
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo do certificado",
        variant: "destructive"
      });
    }
  };

  const handleValidateCertificate = async () => {
    setIsValidating(true);
    try {
      console.log("Iniciando validação do certificado...");
      const config = selectedTab === 'nfse' ? nfseConfig : nfceConfig;
      
      if (!config.certificado_digital || !config.senha_certificado) {
        throw new Error("Certificado e senha são obrigatórios");
      }

      console.log("Enviando certificado para validação...");

      const { data, error } = await supabase.functions.invoke('validate-certificate', {
        body: {
          certificado: config.certificado_digital,
          senha: config.senha_certificado,
        }
      });

      if (error) {
        console.error("Erro na chamada da função:", error);
        throw error;
      }

      console.log("Resposta da validação:", data);

      if (data.success) {
        // Salvar certificado no banco
        const { error: saveError } = await supabase
          .from('certificates')
          .upsert({
            type: selectedTab,
            certificate_data: config.certificado_digital,
            certificate_password: config.senha_certificado,
            valid_until: data.validade,
            is_valid: true
          });

        if (saveError) {
          console.error("Erro ao salvar certificado:", saveError);
          throw new Error("Erro ao salvar certificado no banco de dados");
        }

        if (selectedTab === 'nfse') {
          setNfseConfig({
            ...nfseConfig,
            certificado_digital: config.certificado_digital,
            senha_certificado: config.senha_certificado,
            certificado_valido: true,
            certificado_validade: data.validade
          });
        } else {
          setNfceConfig({
            ...nfceConfig,
            certificado_digital: config.certificado_digital,
            senha_certificado: config.senha_certificado,
            certificado_valido: true,
            certificado_validade: data.validade
          });
        }

        toast({
          title: "Sucesso",
          description: "Certificado digital válido até " + 
            new Date(data.validade).toLocaleDateString(),
        });
      } else {
        throw new Error(data.message || 'Certificado inválido');
      }
    } catch (error: any) {
      console.error('Erro na validação:', error);
      
      // Marcar certificado como inválido no banco
      try {
        await supabase
          .from('certificates')
          .upsert({
            type: selectedTab,
            certificate_data: config.certificado_digital,
            certificate_password: config.senha_certificado,
            is_valid: false,
            valid_until: null
          });
      } catch (dbError) {
        console.error('Erro ao atualizar status do certificado:', dbError);
      }

      if (selectedTab === 'nfse') {
        setNfseConfig({
          ...nfseConfig,
          certificado_valido: false,
          certificado_validade: undefined
        });
      } else {
        setNfceConfig({
          ...nfceConfig,
          certificado_valido: false,
          certificado_validade: undefined
        });
      }

      toast({
        title: "Erro na validação",
        description: error.message || "Certificado digital inválido",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: currentConfig, error: configError } = await supabase
        .from('nfse_config')
        .select('*')
        .limit(1)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      // Se já existe uma configuração, atualiza. Se não, insere.
      const { error: saveError } = await supabase
        .from('nfse_config')
        .upsert({
          id: currentConfig?.id,
          certificado_digital: nfseConfig.certificado_digital,
          senha_certificado: nfseConfig.senha_certificado,
          ambiente: nfseConfig.ambiente,
          inscricao_municipal: nfseConfig.inscricao_municipal,
          regime_tributario: nfseConfig.regime_tributario,
          regime_especial: nfseConfig.regime_especial,
          incentivo_fiscal: nfseConfig.incentivo_fiscal,
          certificado_valido: nfseConfig.certificado_valido,
          certificado_validade: nfseConfig.certificado_validade
        });

      if (saveError) throw saveError;

      await handleSaveAllConfigs();

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nfse">NFS-e</TabsTrigger>
          <TabsTrigger value="nfce">NFC-e</TabsTrigger>
        </TabsList>

        <TabsContent value="nfse" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Certificado Digital</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Arquivo do Certificado (A1)</Label>
                    <Input
                      type="file"
                      accept=".pfx"
                      onChange={handleFileUpload}
                    />
                    {nfseConfig.certificado_digital && (
                      <p className="text-sm text-gray-500">
                        Certificado carregado
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Senha do Certificado</Label>
                    <Input
                      type="password"
                      value={nfseConfig.senha_certificado}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          senha_certificado: e.target.value,
                          certificado_valido: false,
                          certificado_validade: undefined
                        })
                      }
                    />
                  </div>

                  {nfseConfig.certificado_digital && nfseConfig.senha_certificado && (
                    <Button
                      onClick={handleValidateCertificate}
                      disabled={isValidating}
                    >
                      {isValidating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : nfseConfig.certificado_valido ? (
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      )}
                      Validar Certificado
                    </Button>
                  )}

                  {nfseConfig.certificado_validade && (
                    <p className="text-sm text-gray-500">
                      Válido até: {new Date(nfseConfig.certificado_validade).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações NFS-e São Paulo</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={nfseConfig.ambiente}
                      onValueChange={(value) =>
                        setNfseConfig({ ...nfseConfig, ambiente: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Inscrição Municipal</Label>
                    <Input
                      value={nfseConfig.inscricao_municipal}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          inscricao_municipal: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Regime Tributário</Label>
                    <Select
                      value={nfseConfig.regime_tributario}
                      onValueChange={(value) =>
                        setNfseConfig({ ...nfseConfig, regime_tributario: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o regime tributário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples">Simples Nacional</SelectItem>
                        <SelectItem value="presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="real">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Número Inicial do RPS</Label>
                    <Input
                      type="number"
                      value={nfseConfig.numero_inicial_rps}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          numero_inicial_rps: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={nfseConfig.incentivo_fiscal}
                      onCheckedChange={(checked) =>
                        setNfseConfig({ ...nfseConfig, incentivo_fiscal: checked })
                      }
                    />
                    <Label>Incentivador Cultural</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfce" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações NFC-e</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={nfceConfig.ambiente}
                      onValueChange={(value) =>
                        setNfceConfig({ ...nfceConfig, ambiente: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Token IBPT</Label>
                    <Input
                      value={nfceConfig.token_ibpt}
                      onChange={(e) =>
                        setNfceConfig({ ...nfceConfig, token_ibpt: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CSC ID</Label>
                    <Input
                      value={nfceConfig.csc_id}
                      onChange={(e) =>
                        setNfceConfig({ ...nfceConfig, csc_id: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CSC Token</Label>
                    <Input
                      value={nfceConfig.csc_token}
                      onChange={(e) =>
                        setNfceConfig({ ...nfceConfig, csc_token: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};
