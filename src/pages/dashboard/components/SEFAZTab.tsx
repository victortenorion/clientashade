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
  setNfceConfig,
  setNfseConfig,
  handleSaveAllConfigs,
}) => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [certificadoDigital, setCertificadoDigital] = useState("");
  const [senhaCertificado, setSenhaCertificado] = useState("");
  const [certificadoValido, setCertificadoValido] = useState<boolean | undefined>();
  const [certificadoValidade, setCertificadoValidade] = useState<string | undefined>();

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('company_info')
          .select('*')
          .single();

        if (error) throw error;

        if (data) {
          setNfseConfig({
            ...nfseConfig,
            inscricao_municipal: data.inscricao_municipal || '',
            codigo_municipio: data.endereco_codigo_municipio || '',
          });
        }

        const { data: spConfig, error: spError } = await supabase
          .from('nfse_sp_settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (spError && spError.code !== 'PGRST116') throw spError;

        if (spConfig) {
          setNfseConfig({
            ...nfseConfig,
            aliquota_servico: spConfig.aliquota_servico,
            versao_schema: spConfig.versao_schema,
            lote_rps_numero: spConfig.lote_rps_numero,
            operacao_tributacao: spConfig.operacao_tributacao,
            codigo_regime_tributario: spConfig.codigo_regime_tributario,
            tipo_regime_especial: spConfig.tipo_regime_especial
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadCompanyInfo();
  }, []);

  const handleFileUpload = async (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Falha ao ler o arquivo'));
        }
      };
      
      reader.onerror = () => {
        reject(reader.error);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const validateCertificate = async (certificado: string, senha: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-certificate', {
        body: { certificado, senha }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      return { valid: false };
    }
  };

  const handleSaveWithValidation = async () => {
    if (certificadoDigital && senhaCertificado) {
      setIsValidating(true);
      try {
        const validation = await validateCertificate(
          certificadoDigital,
          senhaCertificado
        );

        setCertificadoValido(validation.valid);
        setCertificadoValidade(validation.validUntil);

        setNfceConfig({
          ...nfceConfig,
          certificado_digital: certificadoDigital,
          senha_certificado: senhaCertificado,
          certificado_valido: validation.valid,
          certificado_validade: validation.validUntil,
        });

        setNfseConfig({
          ...nfseConfig,
          certificado_digital: certificadoDigital,
          senha_certificado: senhaCertificado,
          certificado_valido: validation.valid,
          certificado_validade: validation.validUntil,
        });

        if (!validation.valid) {
          toast({
            title: "Erro",
            description: "Certificado ou senha inválidos",
            variant: "destructive",
          });
          return;
        }

        const { data: currentConfig, error: fetchError } = await supabase
          .from('nfse_sp_config')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) throw fetchError;

        if (currentConfig) {
          const { error: updateError } = await supabase
            .from('nfse_sp_config')
            .update({ 
              numero_inicial_rps: parseInt(nfseConfig.numero_inicial_rps?.toString() || "0", 10)
            })
            .eq('id', currentConfig.id);

          if (updateError) throw updateError;
        }

        await handleSaveAllConfigs();
        
        toast({
          title: "Sucesso",
          description: "Certificado validado e configurações salvas com sucesso",
        });
      } catch (error) {
        console.error('Erro na validação do certificado:', error);
        toast({
          title: "Erro",
          description: "Erro ao validar certificado",
          variant: "destructive",
        });
      }
      setIsValidating(false);
    } else {
      try {
        const { data: currentConfig, error: fetchError } = await supabase
          .from('nfse_sp_config')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) throw fetchError;

        if (currentConfig) {
          const { error: updateError } = await supabase
            .from('nfse_sp_config')
            .update({ 
              numero_inicial_rps: parseInt(nfseConfig.numero_inicial_rps?.toString() || "0", 10)
            })
            .eq('id', currentConfig.id);

          if (updateError) throw updateError;
        }

        await handleSaveAllConfigs();
        
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso",
        });
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar configurações",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderCertificateStatus = (isValid?: boolean, validUntil?: string) => {
    if (isValid === undefined) return null;

    return (
      <div className="flex items-center gap-2 mt-2">
        {isValid ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600">
              Certificado válido até {formatDate(validUntil)}
            </span>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-600">
              Certificado inválido
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Certificado Digital</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Certificado Digital (NFC-e e NFS-e)</Label>
                <Input
                  type="file"
                  accept=".pfx"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const fileData = await handleFileUpload(file);
                        setCertificadoDigital(fileData);
                        setCertificadoValido(undefined);
                        setCertificadoValidade(undefined);
                      } catch (error) {
                        console.error('Erro ao carregar arquivo:', error);
                        toast({
                          title: "Erro",
                          description: "Erro ao carregar o certificado",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  disabled={isValidating}
                />
                {renderCertificateStatus(certificadoValido, certificadoValidade)}
              </div>

              <div className="space-y-2">
                <Label>Senha do Certificado</Label>
                <Input
                  type="password"
                  value={senhaCertificado}
                  onChange={(e) => {
                    setSenhaCertificado(e.target.value);
                    setCertificadoValido(undefined);
                    setCertificadoValidade(undefined);
                  }}
                  disabled={isValidating}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações NFS-e São Paulo</h3>

            <div className="grid gap-4">
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
                <Label>Alíquota de Serviço (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={nfseConfig.aliquota_servico || 0}
                  onChange={(e) =>
                    setNfseConfig({
                      ...nfseConfig,
                      aliquota_servico: parseFloat(e.target.value)
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Código do Regime Tributário</Label>
                <Select
                  value={nfseConfig.codigo_regime_tributario || "1"}
                  onValueChange={(value) =>
                    setNfseConfig({
                      ...nfseConfig,
                      codigo_regime_tributario: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime tributário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Simples Nacional</SelectItem>
                    <SelectItem value="2">2 - Lucro Presumido</SelectItem>
                    <SelectItem value="3">3 - Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Regime Especial de Tributação</Label>
                <Select
                  value={nfseConfig.tipo_regime_especial || ""}
                  onValueChange={(value) =>
                    setNfseConfig({
                      ...nfseConfig,
                      tipo_regime_especial: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime especial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    <SelectItem value="1">1 - Microempresa Municipal</SelectItem>
                    <SelectItem value="2">2 - Estimativa</SelectItem>
                    <SelectItem value="3">3 - Sociedade de Profissionais</SelectItem>
                    <SelectItem value="4">4 - Cooperativa</SelectItem>
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
                      operacao_tributacao: value
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número do Lote RPS</Label>
                <Input
                  type="number"
                  value={nfseConfig.lote_rps_numero || 1}
                  onChange={(e) =>
                    setNfseConfig({
                      ...nfseConfig,
                      lote_rps_numero: parseInt(e.target.value)
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveWithValidation}
          disabled={isValidating}
        >
          {isValidating && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isValidating ? 'Validando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};
