
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NFSeEmissionForm } from "./components/nfse/NFSeEmissionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatisticData {
  total_emitidas: number;
  total_hoje: number;
  total_mes: number;
  valor_total_mes: number;
}

export default function NFSeForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: nfseId } = useParams();
  const [open, setOpen] = useState(true);
  const [statisticData, setStatisticData] = useState<StatisticData>({
    total_emitidas: 0,
    total_hoje: 0,
    total_mes: 0,
    valor_total_mes: 0
  });
  
  const serviceOrderId = searchParams.get('service_order_id');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Carregar estatísticas
      const { data, error } = await supabase
        .from('nfse')
        .select('id, valor_servicos, created_at')
        .eq('cancelada', false);

      if (error) throw error;

      if (data) {
        const totalEmitidas = data.length;
        const totalHoje = data.filter(nfs => {
          const date = new Date(nfs.created_at);
          return date.toDateString() === today.toDateString();
        }).length;

        const notasDoMes = data.filter(nfs => {
          const date = new Date(nfs.created_at);
          return date >= firstDayOfMonth && date <= lastDayOfMonth;
        });

        const totalMes = notasDoMes.length;
        const valorTotalMes = notasDoMes.reduce((acc, nfs) => 
          acc + (nfs.valor_servicos || 0), 0);

        setStatisticData({
          total_emitidas: totalEmitidas,
          total_hoje: totalHoje,
          total_mes: totalMes,
          valor_total_mes: valorTotalMes
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {nfseId ? "Editar NFS-e" : "Nova NFS-e"}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Emitidas
            </CardTitle>
            <Badge>{statisticData.total_emitidas}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statisticData.total_emitidas}</div>
            <p className="text-xs text-muted-foreground">
              NFS-e emitidas no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emitidas Hoje
            </CardTitle>
            <Badge variant="secondary">{statisticData.total_hoje}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statisticData.total_hoje}</div>
            <p className="text-xs text-muted-foreground">
              NFS-e emitidas hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emitidas no Mês
            </CardTitle>
            <Badge variant="secondary">{statisticData.total_mes}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statisticData.total_mes}</div>
            <p className="text-xs text-muted-foreground">
              NFS-e emitidas este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statisticData.valor_total_mes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total das NFS-e do mês
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {nfseId ? "Editar NFS-e" : "Emitir NFS-e"}
            </DialogTitle>
          </DialogHeader>
          
          <NFSeEmissionForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
