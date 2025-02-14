import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const NFSeForm = () => {
  const [serviceCode, setServiceCode] = useState('');
  const [cnae, setCnae] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadFiscalConfig = async () => {
      const { data: fiscalData, error: fiscalError } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'general')
        .single();

      if (fiscalError) {
        console.error('Erro ao carregar configurações fiscais:', fiscalError);
        return;
      }

      if (fiscalData?.config) {
        const config = fiscalData.config as { service_code: string; cnae: string };
        setServiceCode(config.service_code || '');
        setCnae(config.cnae || '');
      }
    };

    loadFiscalConfig();
  }, []);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('fiscal_config')
        .upsert(
          {
            type: 'general',
            config: {
              service_code: serviceCode,
              cnae: cnae,
            },
          },
          { onConflict: 'type' }
        );

      if (error) {
        console.error('Erro ao salvar configurações fiscais:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar as configurações fiscais",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Configurações fiscais salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações fiscais:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações fiscais",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Fiscais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="serviceCode">Código de Serviço</Label>
          <Input
            id="serviceCode"
            value={serviceCode}
            onChange={(e) => setServiceCode(e.target.value)}
            placeholder="Digite o código de serviço"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cnae">CNAE</Label>
          <Input
            id="cnae"
            value={cnae}
            onChange={(e) => setCnae(e.target.value)}
            placeholder="Digite o CNAE"
          />
        </div>
        <Button onClick={handleSave}>Salvar</Button>
      </CardContent>
    </Card>
  );
};
