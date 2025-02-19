import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NFCeConfig, NFSeConfig, FiscalConfig } from "../types/config.types";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { ArrowDownToLine, Filter, FileText, ArrowUpToLine, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SEFAZTabProps {
  nfceConfig: NFCeConfig;
  nfseConfig: NFSeConfig;
  fiscalConfig: FiscalConfig;
  setNfceConfig: (config: NFCeConfig) => void;
  setNfseConfig: (config: NFSeConfig) => void;
  setFiscalConfig: (config: FiscalConfig) => void;
  handleSaveAllConfigs: () => Promise<void>;
}

export function SEFAZTab({
  nfceConfig,
  nfseConfig,
  fiscalConfig,
  setNfceConfig,
  setNfseConfig,
  setFiscalConfig,
  handleSaveAllConfigs
}: SEFAZTabProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, configType: 'nfse' | 'nfce') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', configType);

      const { data: uploadedFile, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(`${configType}/${file.name}`, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('certificates')
        .getPublicUrl(`${configType}/${file.name}`);

      if (configType === 'nfse') {
        setNfseConfig({
          ...nfseConfig,
          certificado_digital: publicUrl.publicUrl,
          certificado_valido: true,
          certificado_validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else {
        setNfceConfig({
          ...nfceConfig,
          certificado_digital: publicUrl.publicUrl,
          certificado_valido: true,
          certificado_validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      toast({
        title: "Sucesso",
        description: "Certificado digital enviado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao enviar certificado:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao enviar certificado digital"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="nfse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nfse">NFS-e</TabsTrigger>
          <TabsTrigger value="nfce">NFC-e</TabsTrigger>
          <TabsTrigger value="fiscal">Configurações Fiscais</TabsTrigger>
        </TabsList>

        <TabsContent value="nfse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações NFS-e - Prefeitura de São Paulo</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Certificado Digital A1</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="nfse_certificado">Certificado Digital (A1)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="nfse_certificado"
                          type="file"
                          accept=".pfx"
                          onChange={(e) => handleFileUpload(e, 'nfse')}
                          className="flex-1"
                        />
                        {nfseConfig.certificado_valido && (
                          <Badge variant="default" className="whitespace-nowrap bg-green-500">
                            Válido até {new Date(nfseConfig.certificado_validade || '').toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="nfse_senha_certificado">Senha do Certificado</Label>
                      <Input
                        id="nfse_senha_certificado"
                        type="password"
                        value={nfseConfig.senha_certificado}
                        onChange={(e) => setNfseConfig({ ...nfseConfig, senha_certificado: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações de RPS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nfse_serie_rps">Série do RPS</Label>
                      <Input
                        id="nfse_serie_rps"
                        value={nfseConfig.serie_rps_padrao}
                        onChange={(e) => setNfseConfig({ ...nfseConfig, serie_rps_padrao: e.target.value })}
                        placeholder="Ex: RPS"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nfse_tipo_rps">Tipo do RPS</Label>
                      <Select
                        value={nfseConfig.tipo_rps}
                        onValueChange={(value) => setNfseConfig({ ...nfseConfig, tipo_rps: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RPS">RPS</SelectItem>
                          <SelectItem value="NFTS">NFTS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="nfse_numero_inicial_rps">Número Inicial do RPS</Label>
                      <Input
                        id="nfse_numero_inicial_rps"
                        value={nfseConfig.numero_inicial_rps}
                        onChange={(e) => setNfseConfig({ ...nfseConfig, numero_inicial_rps: e.target.value })}
                        placeholder="Ex: 1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lote_rps_numero">Número do Lote RPS</Label>
                      <Input
                        id="lote_rps_numero"
                        type="number"
                        value={nfseConfig.lote_rps_numero}
                        onChange={(e) => setNfseConfig({ ...nfseConfig, lote_rps_numero: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações da Prefeitura</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="usuario_emissor">Usuário Emissor</Label>
                      <Input
                        id="usuario_emissor"
                        value={nfseConfig.usuario_emissor}
                        onChange={(e) => setNfseConfig({ ...nfseConfig, usuario_emissor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="senha_emissor">Senha Emissor</Label>
                      <Input
                        id="senha_emissor"
                        type="password"
                        value={nfseConfig.senha_emissor}
                        onChange={(e) => setNfseConfig({ ...nfseConfig, senha_emissor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ambiente">Ambiente</Label>
                      <Select
                        value={nfseConfig.ambiente}
                        onValueChange={(value) => setNfseConfig({ ...nfseConfig, ambiente: value })}
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
                    <div>
                      <Label htmlFor="versao_schema">Versão do Schema</Label>
                      <Input
                        id="versao_schema"
                        value={nfseConfig.versao_schema}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações Fiscais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="regime_tributario">Regime Tributário</Label>
                      <Select
                        value={nfseConfig.regime_tributario}
                        onValueChange={(value) => setNfseConfig({ ...nfseConfig, regime_tributario: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o regime" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Simples Nacional</SelectItem>
                          <SelectItem value="2">Lucro Presumido</SelectItem>
                          <SelectItem value="3">Lucro Real</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="operacao_tributacao">Operação Tributação</Label>
                      <Select
                        value={nfseConfig.operacao_tributacao}
                        onValueChange={(value) => setNfseConfig({ ...nfseConfig, operacao_tributacao: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a operação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Tributação no Município</SelectItem>
                          <SelectItem value="2">Tributação Fora do Município</SelectItem>
                          <SelectItem value="3">Isenção</SelectItem>
                          <SelectItem value="4">Imune</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="aliquota_servico">Alíquota de Serviço (%)</Label>
                      <Input
                        id="aliquota_servico"
                        type="number"
                        step="0.01"
                        value={nfseConfig.aliquota_servico}
                        onChange={(e) => setNfseConfig({ ...nfseConfig, aliquota_servico: parseFloat(e.target.value) })}
                        placeholder="Ex: 5.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="incentivo_fiscal">Incentivo Fiscal</Label>
                      <Select
                        value={nfseConfig.incentivo_fiscal ? "true" : "false"}
                        onValueChange={(value) => setNfseConfig({ ...nfseConfig, incentivo_fiscal: value === "true" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfce" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificado Digital A1</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nfce_certificado">Certificado Digital (A1)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="nfce_certificado"
                        type="file"
                        accept=".pfx"
                        onChange={(e) => handleFileUpload(e, 'nfce')}
                        className="flex-1"
                      />
                      {nfceConfig.certificado_valido && (
                        <Badge variant="default" className="whitespace-nowrap bg-green-500">
                          Válido até {new Date(nfceConfig.certificado_validade || '').toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="nfce_senha_certificado">Senha do Certificado</Label>
                    <Input
                      id="nfce_senha_certificado"
                      type="password"
                      value={nfceConfig.senha_certificado}
                      onChange={(e) => setNfceConfig({ ...nfceConfig, senha_certificado: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nfce_ambiente">Ambiente</Label>
                  <Select
                    value={nfceConfig.ambiente}
                    onValueChange={(value) => setNfceConfig({ ...nfceConfig, ambiente: value })}
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

                <div>
                  <Label htmlFor="nfce_regime_tributario">Regime Tributário</Label>
                  <Select
                    value={nfceConfig.regime_tributario}
                    onValueChange={(value) => setNfceConfig({ ...nfceConfig, regime_tributario: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime tributário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Simples Nacional</SelectItem>
                      <SelectItem value="2">Lucro Presumido</SelectItem>
                      <SelectItem value="3">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="nfce_inscricao_estadual">Inscrição Estadual</Label>
                  <Input
                    id="nfce_inscricao_estadual"
                    value={nfceConfig.inscricao_estadual}
                    onChange={(e) => setNfceConfig({ ...nfceConfig, inscricao_estadual: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fiscal_service_code">Código do Serviço</Label>
                  <Input
                    id="fiscal_service_code"
                    value={fiscalConfig.service_code}
                    onChange={(e) => setFiscalConfig({ ...fiscalConfig, service_code: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="fiscal_cnae">CNAE</Label>
                  <Input
                    id="fiscal_cnae"
                    value={fiscalConfig.cnae}
                    onChange={(e) => setFiscalConfig({ ...fiscalConfig, cnae: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="fiscal_tax_regime">Regime Tributário</Label>
                  <Select
                    value={fiscalConfig.tax_regime}
                    onValueChange={(value) => setFiscalConfig({ ...fiscalConfig, tax_regime: value })}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button onClick={handleSaveAllConfigs} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
}
