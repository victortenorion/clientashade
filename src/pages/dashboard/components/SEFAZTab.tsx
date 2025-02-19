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
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

interface ChartData {
  name: string;
  sucesso: number;
  erro: number;
  pendente: number;
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
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [documentType, setDocumentType] = useState<"all" | "nfse" | "nfce">("all");

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

  useEffect(() => {
    loadTransmissionStats();
    loadChartData();
  }, [selectedPeriod, documentType]);

  const loadChartData = async () => {
    try {
      setIsLoading(true);
      
      const now = new Date();
      let startDate = new Date();
      const labels: string[] = [];
      
      switch (selectedPeriod) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          for (let i = 0; i < 24; i++) {
            labels.push(`${i}h`);
          }
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
          }
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit' }));
          }
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('pt-BR', { month: 'short' }));
          }
          break;
      }

      let query = supabase
        .from('sefaz_transmission_queue')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (documentType !== 'all') {
        query = query.eq('tipo', documentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const chartData: ChartData[] = labels.map(label => ({
          name: label,
          sucesso: 0,
          erro: 0,
          pendente: 0
        }));

        data.forEach(item => {
          const date = new Date(item.created_at);
          let index = 0;

          switch (selectedPeriod) {
            case "today":
              index = date.getHours();
              break;
            case "week":
              index = 6 - Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
              break;
            case "month":
              index = 30 - Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
              break;
            case "year":
              index = 11 - (now.getMonth() - date.getMonth() + (12 * (now.getFullYear() - date.getFullYear())));
              break;
          }

          if (index >= 0 && index < chartData.length) {
            chartData[index][item.status as keyof Omit<ChartData, 'name'>]++;
          }
        });

        setChartData(chartData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransmissionStats = async () => {
    try {
      setIsLoading(true);
      
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
          <Select value={documentType} onValueChange={(value: "all" | "nfse" | "nfce") => setDocumentType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="nfse">NFS-e</SelectItem>
              <SelectItem value="nfce">NFC-e</SelectItem>
            </SelectContent>
          </Select>
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

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transmissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sucesso"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  name="Sucesso"
                />
                <Area
                  type="monotone"
                  dataKey="erro"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  name="Erro"
                />
                <Area
                  type="monotone"
                  dataKey="pendente"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  name="Pendente"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sucesso" fill="#10b981" name="Sucesso" />
                <Bar dataKey="erro" fill="#ef4444" name="Erro" />
                <Bar dataKey="pendente" fill="#f59e0b" name="Pendente" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="nfse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nfse">NFS-e</TabsTrigger>
          <TabsTrigger value="nfce">NFC-e</TabsTrigger>
          <TabsTrigger value="fiscal">Configurações Fiscais</TabsTrigger>
        </TabsList>

        <TabsContent value="nfse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificado Digital A1</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
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

                <div>
                  <Label htmlFor="nfse_numero_inicial_rps">Número Inicial do RPS</Label>
                  <Input
                    id="nfse_numero_inicial_rps"
                    value={nfseConfig.numero_inicial_rps}
                    onChange={(e) => setNfseConfig({ ...nfseConfig, numero_inicial_rps: e.target.value })}
                  />
                </div>

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
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
