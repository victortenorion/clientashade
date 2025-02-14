
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
    id: "",
    service_code: "",
    cnae: "",
    tax_regime: ""
  });

  const loadFiscalConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_config')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setFiscalConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações fiscais.",
        variant: "destructive"
      });
    }
  };

  const handleSaveConfig = async () => {
    try {
      let query;
      if (fiscalConfig.id) {
        // Update
        query = supabase
          .from('fiscal_config')
          .update({
            service_code: fiscalConfig.service_code,
            cnae: fiscalConfig.cnae,
            tax_regime: fiscalConfig.tax_regime
          })
          .eq('id', fiscalConfig.id);
      } else {
        // Insert
        query = supabase
          .from('fiscal_config')
          .insert([{
            service_code: fiscalConfig.service_code,
            cnae: fiscalConfig.cnae,
            tax_regime: fiscalConfig.tax_regime
          }]);
      }

      const { error } = await query;
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações fiscais salvas com sucesso.",
      });

      // Recarrega os dados após salvar
      loadFiscalConfig();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações fiscais.",
        variant: "destructive"
      });
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
            <Button onClick={handleSaveConfig}>
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
