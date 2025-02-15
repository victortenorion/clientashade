
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface FiscalTabProps {
  nfceConfig: any;
  nfseConfig: any;
  fiscalConfig: any;
  serviceCodes: any[];
  serviceCodeSearch: string;
  setServiceCodeSearch: (search: string) => void;
  setNfceConfig: (config: any) => void;
  setNfseConfig: (config: any) => void;
  setFiscalConfig: (config: any) => void;
  fetchServiceCodes: () => void;
  handleNFCeConfigSave: () => Promise<void>;
  handleNFSeConfigSave: () => Promise<void>;
  handleFiscalConfigSave: () => Promise<void>;
  handleSaveAllConfigs: () => Promise<void>;
}
