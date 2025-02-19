
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NFCeConfig, NFSeConfig, FiscalConfig } from "../../types/config.types";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { ArrowDownToLine, Filter, FileText, ArrowUpToLine } from "lucide-react";
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

interface TransmissionStats {
  total_enviadas: number;
  sucesso: number;
  erro: number;
  pendentes: number;
  ultimo_envio?: string;
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
  const [transmissionStats, setTransmissionStats] = useState<TransmissionStats>({
    total_enviadas: 0,
    sucesso: 0,
    erro: 0,
    pendentes: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  useEffect(() => {
    loadTransmissionStats();
  }, [selectedPeriod]);

  const loadTransmissionStats = async () => {
    try {
      setIsLoading(true);
      
      // Definir período de consulta
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Buscar estatísticas de transmissão
      const { data, error } = await supabase
        .from('sefaz_transmission_queue')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      if (data) {
        const stats = {
          total_enviadas: data.length,
          sucesso: data.filter(d => d.status === 'sucesso').length,
          erro: data.filter(d => d.status === 'erro').length,
          pendentes: data.filter(d => d.status === 'pendente').length,
          ultimo_envio: data.length > 0 ? 
            new Date(Math.max(...data.map(d => new Date(d.created_at).getTime()))).toLocaleString() : 
            undefined
        };
        setTransmissionStats(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar estatísticas de transmissão"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sefaz_transmission_queue')
        .select(`
          *,
          nfse (
            numero_nfse,
            valor_servicos,
            created_at,
            status_sefaz
          )
        `)
        .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

      if (error) throw error;

      if (data) {
        const csvContent = "data:text/csv;charset=utf-8," 
          + "Data,Tipo,Status,Número NFS-e,Valor,Status SEFAZ\n"
          + data.map(row => {
            const nfse = row.nfse;
            return `${new Date(row.created_at).toLocaleDateString()},${row.tipo},${row.status},${nfse?.numero_nfse || ''},${nfse?.valor_servicos || ''},${nfse?.status_sefaz || ''}`
          }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_transmissao_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Sucesso",
          description: "Relatório exportado com sucesso"
        });
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao exportar relatório"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Configurações SEFAZ</h2>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            disabled={isLoading}
          >
            <FileText className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transmissões
            </CardTitle>
            <Badge>{transmissionStats.total_enviadas}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transmissionStats.total_enviadas}</div>
            <p className="text-xs text-muted-foreground">
              Total de documentos transmitidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transmissões com Sucesso
            </CardTitle>
            <Badge variant="default">{transmissionStats.sucesso}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transmissionStats.sucesso}</div>
            <p className="text-xs text-muted-foreground">
              Documentos transmitidos com sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transmissões com Erro
            </CardTitle>
            <Badge variant="destructive">{transmissionStats.erro}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transmissionStats.erro}</div>
            <p className="text-xs text-muted-foreground">
              Documentos com erro na transmissão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transmissões Pendentes
            </CardTitle>
            <Badge variant="secondary">{transmissionStats.pendentes}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transmissionStats.pendentes}</div>
            <p className="text-xs text-muted-foreground">
              Documentos aguardando transmissão
            </p>
            {transmissionStats.ultimo_envio && (
              <p className="text-xs text-muted-foreground mt-2">
                Último envio: {transmissionStats.ultimo_envio}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="nfse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nfse">NFS-e</TabsTrigger>
          <TabsTrigger value="nfce">NFC-e</TabsTrigger>
          <TabsTrigger value="fiscal">Configurações Fiscais</TabsTrigger>
        </TabsList>

        <TabsContent value="nfse" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nfse_ambiente">Ambiente</Label>
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
                    <Label htmlFor="nfse_regime_tributario">Regime Tributário</Label>
                    <Select
                      value={nfseConfig.regime_tributario}
                      onValueChange={(value) => setNfseConfig({ ...nfseConfig, regime_tributario: value })}
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
                </div>

                <div>
                  <Label htmlFor="nfse_inscricao_municipal">Inscrição Municipal</Label>
                  <Input
                    id="nfse_inscricao_municipal"
                    value={nfseConfig.inscricao_municipal}
                    onChange={(e) => setNfseConfig({ ...nfseConfig, inscricao_municipal: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="nfse_regime_especial">Regime Especial</Label>
                  <Input
                    id="nfse_regime_especial"
                    value={nfseConfig.regime_especial}
                    onChange={(e) => setNfseConfig({ ...nfseConfig, regime_especial: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfce" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
