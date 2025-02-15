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
import { FiscalTab } from "./FiscalTab";

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

  const handleValidateCertificate = async () => {
    setIsValidating(true);
    try {
      const response = await fetch('https://eroqgxpjiqmftkgqyunj.supabase.co/functions/v1/validate-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificado: selectedTab === 'nfse' ? nfseConfig.certificado_digital : nfceConfig.certificado_digital,
          senha: selectedTab === 'nfse' ? nfseConfig.senha_certificado : nfceConfig.senha_certificado,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (selectedTab === 'nfse') {
        setNfseConfig({
          ...nfseConfig,
          certificado_valido: true,
          certificado_validade: data.validade,
        });
      } else {
        setNfceConfig({
          ...nfceConfig,
          certificado_valido: true,
          certificado_validade: data.validade,
        });
      }

      toast({
        title: "Sucesso",
        description: "Certificado digital válido",
      });
    } catch (error) {
      console.error('Erro na validação:', error);
      if (selectedTab === 'nfse') {
        setNfseConfig({
          ...nfseConfig,
          certificado_valido: false,
          certificado_validade: undefined,
        });
      } else {
        setNfceConfig({
          ...nfceConfig,
          certificado_valido: false,
          certificado_validade: undefined,
        });
      }

      toast({
        title: "Erro",
        description: "Certificado digital inválido",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await handleSaveAllConfigs();
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
    } catch (error) {
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result?.toString().split(',')[1];
                            if (base64) {
                              setNfseConfig({
                                ...nfseConfig,
                                certificado_digital: base64,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
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
                    <Label>Versão do Schema</Label>
                    <Select
                      value={nfseConfig.versao_schema || "2.00"}
                      onValueChange={(value) =>
                        setNfseConfig({ ...nfseConfig, versao_schema: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a versão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2.00">2.00</SelectItem>
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
                    <Label>Código do Município</Label>
                    <Input
                      value={nfseConfig.codigo_municipio}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          codigo_municipio: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Regime Tributário</Label>
                    <Select
                      value={nfseConfig.codigo_regime_tributario || "1"}
                      onValueChange={(value) =>
                        setNfseConfig({
                          ...nfseConfig,
                          codigo_regime_tributario: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o regime tributário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Simples Nacional</SelectItem>
                        <SelectItem value="2">2 - Estimativa</SelectItem>
                        <SelectItem value="3">3 - Sociedade de Profissionais</SelectItem>
                        <SelectItem value="4">4 - MEI</SelectItem>
                        <SelectItem value="5">5 - Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Operação de Tributação</Label>
                    <Select
                      value={nfseConfig.operacao_tributacao || "1"}
                      onValueChange={(value) =>
                        setNfseConfig({
                          ...nfseConfig,
                          operacao_tributacao: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a operação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Tributação no Município</SelectItem>
                        <SelectItem value="2">2 - Tributação Fora do Município</SelectItem>
                        <SelectItem value="3">3 - Isenção</SelectItem>
                        <SelectItem value="4">4 - Imune</SelectItem>
                        <SelectItem value="5">5 - Exigibilidade Suspensa por Decisão Judicial</SelectItem>
                        <SelectItem value="6">6 - Exigibilidade Suspensa por Procedimento Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
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
