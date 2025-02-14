
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NotasFiscaisTabProps {
  fiscalConfig: {
    service_code: string;
    cnae: string;
    tax_regime: string;
  };
  setFiscalConfig: (config: any) => void;
  handleSaveAllConfigs: () => void;
}

export const NotasFiscaisTab = ({
  fiscalConfig,
  setFiscalConfig,
  handleSaveAllConfigs
}: NotasFiscaisTabProps) => {
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
            <Button onClick={handleSaveAllConfigs}>
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
