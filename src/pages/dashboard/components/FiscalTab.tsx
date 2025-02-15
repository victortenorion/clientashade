import React from "react";
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
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface FiscalConfig {
  service_code: string;
  cnae: string;
  tax_regime: string;
}

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

interface ServiceCode {
  code: string;
  description: string;
}

interface FiscalTabProps {
  nfceConfig: NFCeConfig;
  nfseConfig: NFSeConfig;
  fiscalConfig: FiscalConfig;
  serviceCodes: ServiceCode[];
  serviceCodeSearch: string;
  setServiceCodeSearch: (value: string) => void;
  setNfceConfig: (config: NFCeConfig) => void;
  setNfseConfig: (config: NFSeConfig) => void;
  setFiscalConfig: (config: FiscalConfig) => void;
  fetchServiceCodes: () => void;
  handleNFCeConfigSave: (config: NFCeConfig) => void;
  handleNFSeConfigSave: (config: NFSeConfig) => void;
  handleFiscalConfigSave: (config: FiscalConfig) => void;
  handleSaveAllConfigs: () => void;
}

export const FiscalTab: React.FC<FiscalTabProps> = ({
  nfceConfig,
  nfseConfig,
  fiscalConfig,
  serviceCodes,
  serviceCodeSearch,
  setServiceCodeSearch,
  setNfceConfig,
  setNfseConfig,
  setFiscalConfig,
  fetchServiceCodes,
  handleNFCeConfigSave,
  handleNFSeConfigSave,
  handleFiscalConfigSave,
  handleSaveAllConfigs,
}) => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateNFSeSP = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-nfse-sp');

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Configurações da NFS-e SP válidas",
        });
      } else {
        toast({
          title: "Atenção",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro na validação:', error);
      toast({
        title: "Erro",
        description: "Erro ao validar configurações da NFS-e SP",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const filteredServiceCodes = serviceCodes.filter(
    (code) =>
      code.code.toLowerCase().includes(serviceCodeSearch.toLowerCase()) ||
      code.description.toLowerCase().includes(serviceCodeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Configurações Fiscais</h3>
              <Button 
                variant="outline" 
                onClick={handleValidateNFSeSP}
                disabled={isValidating}
              >
                {isValidating ? "Validando..." : "Validar Configurações NFS-e SP"}
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>CNAE</Label>
                <Input
                  value={fiscalConfig.cnae}
                  onChange={(e) =>
                    setFiscalConfig({ ...fiscalConfig, cnae: e.target.value })
                  }
                  placeholder="Digite o CNAE"
                />
              </div>

              <div className="space-y-2">
                <Label>Regime Tributário</Label>
                <Select
                  value={fiscalConfig.tax_regime}
                  onValueChange={(value) =>
                    setFiscalConfig({ ...fiscalConfig, tax_regime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime tributário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples Nacional</SelectItem>
                    <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Código de Serviço</Label>
                <div className="flex gap-2">
                  <Input
                    value={serviceCodeSearch}
                    onChange={(e) => setServiceCodeSearch(e.target.value)}
                    placeholder="Pesquisar código ou descrição"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchServiceCodes}
                    type="button"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={fiscalConfig.service_code}
                  onValueChange={(value) =>
                    setFiscalConfig({ ...fiscalConfig, service_code: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o código de serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServiceCodes.map((code) => (
                      <SelectItem key={code.code} value={code.code}>
                        {code.code} - {code.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleSaveAllConfigs()}>
                Salvar Configurações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
