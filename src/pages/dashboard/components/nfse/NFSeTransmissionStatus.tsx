
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NFSeTransmissionStatusProps {
  nfseId: string;
}

interface NFSeEvento {
  tipo_evento: string;
  descricao: string;
  status: string;
  created_at: string;
}

export function NFSeTransmissionStatus({ nfseId }: NFSeTransmissionStatusProps) {
  const [status, setStatus] = useState<string>("");
  const [eventos, setEventos] = useState<NFSeEvento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [nfseResponse, eventosResponse] = await Promise.all([
          supabase
            .from('nfse')
            .select('status_sefaz, cancelada')
            .eq('id', nfseId)
            .single(),
          supabase
            .from('nfse_eventos')
            .select('*')
            .eq('nfse_id', nfseId)
            .order('created_at', { ascending: false })
        ]);

        if (nfseResponse.data) {
          setStatus(nfseResponse.data.cancelada ? 'cancelada' : nfseResponse.data.status_sefaz);
        }

        if (eventosResponse.data) {
          setEventos(eventosResponse.data);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar status:', error);
        setIsLoading(false);
      }
    };

    const channel = supabase
      .channel('nfse_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nfse',
          filter: `id=eq.${nfseId}`
        },
        (payload) => {
          if (payload.new) {
            setStatus(payload.new.cancelada ? 'cancelada' : payload.new.status_sefaz);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nfse_eventos',
          filter: `nfse_id=eq.${nfseId}`
        },
        async () => {
          const { data } = await supabase
            .from('nfse_eventos')
            .select('*')
            .eq('nfse_id', nfseId)
            .order('created_at', { ascending: false });
          
          if (data) {
            setEventos(data);
          }
        }
      )
      .subscribe();

    fetchStatus();

    return () => {
      channel.unsubscribe();
    };
  }, [nfseId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processando':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'sucesso':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'erro':
      case 'cancelada':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'warning';
      case 'processando':
        return 'secondary';
      case 'sucesso':
        return 'success';
      case 'erro':
      case 'cancelada':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Carregando status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Status da Transmissão</h4>
            <Badge variant={getStatusBadgeVariant(status)} className="flex items-center gap-1">
              {getStatusIcon(status)}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>

          {eventos.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Histórico de Eventos</h5>
              <div className="space-y-2">
                {eventos.map((evento, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg border p-2 text-sm"
                  >
                    {getStatusIcon(evento.status)}
                    <div>
                      <p className="font-medium">
                        {evento.tipo_evento.charAt(0).toUpperCase() + evento.tipo_evento.slice(1)}
                      </p>
                      <p className="text-muted-foreground">{evento.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evento.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
