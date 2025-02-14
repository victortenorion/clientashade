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
import { Loader2 } from "lucide-react";

interface NFCeConfig {
  certificado_digital: string;
  senha_certificado: string;
  ambiente: string;
  token_ibpt: string;
  csc_id: string;
  csc_token: string;
  inscricao_estadual: string;
  regime_tributario: string;
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
  const [isValidatingNFCe, setIsValidatingNFCe] = useState(false);
  const [isValidatingNFSe, setIsValidatingNFSe] = useState(false);

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
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
      }
    };

    loadCompanyInfo();
  }, []);

  const validateCertificate = async (certificado: string, senha: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-certificate', {
        body: { certificado, senha }
      });

      if (error) throw error;

      return data.valid;
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      return false;
    }
  };

  const handleSaveWithValidation = async () => {
    let hasErrors = false;

    // Validar certificado NFC-e
    if (nfceConfig.certificado_digital && nfceConfig.senha_certificado) {
      setIsValidatingNFCe(true);
      const isNFCeValid = await validateCertificate(
        nfceConfig.certificado_digital,
        nfceConfig.senha_certificado
      );

      if (!isNFCeValid) {
        toast({
          title: "Erro",
          description: "Certificado ou senha da NFC-e inválidos",
          variant: "destructive",
        });
        hasErrors = true;
      }
      setIsValidatingNFCe(false);
    }

    // Validar certificado NFS-e
    if (nfseConfig.certificado_digital && nfseConfig.senha_certificado) {
      setIsValidatingNFSe(true);
      const isNFSeValid = await validateCertificate(
        nfseConfig.certificado_digital,
        nfseConfig.senha_certificado
      );

      if (!isNFSeValid) {
        toast({
          title: "Erro",
          description: "Certificado ou senha da NFS-e inválidos",
          variant: "destructive",
        });
        hasErrors = true;
      }
      setIsValidatingNFSe(false);
    }

    if (!hasErrors) {
      handleSaveAllConfigs();
      toast({
        title: "Sucesso",
        description: "Certificados validados e configurações salvas com sucesso",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* NFC-e Config */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações NFC-e</h3>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Certificado Digital</Label>
                <Input
                  type="file"
                  accept=".pfx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setNfceConfig({
                            ...nfceConfig,
                            certificado_digital: event.target.result as string,
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  disabled={isValidatingNFCe}
                />
              </div>

              <div className="space-y-2">
                <Label>Senha do Certificado</Label>
                <Input
                  type="password"
                  value={nfceConfig.senha_certificado}
                  onChange={(e) =>
                    setNfceConfig({
                      ...nfceConfig,
                      senha_certificado: e.target.value,
                    })
                  }
                  disabled={isValidatingNFCe}
                />
              </div>

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

      {/* NFS-e Config */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações NFS-e</h3>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Certificado Digital</Label>
                <Input
                  type="file"
                  accept=".pfx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setNfseConfig({
                            ...nfseConfig,
                            certificado_digital: event.target.result as string,
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  disabled={isValidatingNFSe}
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
                  disabled={isValidatingNFSe}
                />
              </div>

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
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Código do Município</Label>
                <Input
                  value={nfseConfig.codigo_municipio}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Incentivo Fiscal</Label>
                <Switch
                  checked={nfseConfig.incentivo_fiscal}
                  onCheckedChange={(checked) =>
                    setNfseConfig({
                      ...nfseConfig,
                      incentivo_fiscal: checked,
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
          disabled={isValidatingNFCe || isValidatingNFSe}
        >
          {(isValidatingNFCe || isValidatingNFSe) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isValidatingNFCe || isValidatingNFSe ? 'Validando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};
