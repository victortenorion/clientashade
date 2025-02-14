import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const NotasFiscaisTab = () => {
  const { toast } = useToast();
  const [fiscalConfig, setFiscalConfig] = useState({
    service_code: '',
    cnae: '',
    tax_regime: ''
  });

  const loadFiscalConfig = async () => {
    const { data, error } = await supabase
      .from('fiscal_config')
      .select('*')
      .eq('type', 'general')
      .single();

    if (error) {
      console.error('Erro ao carregar configurações fiscais:', error);
      return;
    }

    if (data?.config) {
      setFiscalConfig(data.config as any);
    }
  };

  const handleSaveFiscalConfig = async () => {
    const { error } = await supabase
      .from('fiscal_config')
      .upsert({
        type: 'general',
        config: fiscalConfig
      }, {
        onConflict: 'type'
      });

    if (error) {
      console.error('Erro ao salvar configurações fiscais:', error);
    }
  };

  useEffect(() => {
    loadFiscalConfig();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notas Fiscais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CNAE Principal</Label>
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
              <Label>Código de Serviço Principal</Label>
              <Input
                value={fiscalConfig.service_code}
                onChange={(e) =>
                  setFiscalConfig({ ...fiscalConfig, service_code: e.target.value })
                }
                placeholder="Digite o código de serviço"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSaveFiscalConfig}>
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
