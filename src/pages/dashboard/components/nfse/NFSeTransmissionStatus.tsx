
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NFSeTransmissionStatusProps {
  nfseId: string;
}

export function NFSeTransmissionStatus({ nfseId }: NFSeTransmissionStatusProps) {
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('nfse')
        .select('status_sefaz')
        .eq('id', nfseId)
        .single();

      if (!error && data) {
        setStatus(data.status_sefaz);
      }
      setIsLoading(false);
    };

    const channel = supabase
      .channel('nfse_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'nfse',
          filter: `id=eq.${nfseId}`
        },
        (payload) => {
          setStatus(payload.new.status_sefaz);
        }
      )
      .subscribe();

    fetchStatus();

    return () => {
      channel.unsubscribe();
    };
  }, [nfseId]);

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
        <div className="space-y-2">
          <h4 className="font-medium">Status da Transmissão</h4>
          <div className="flex items-center gap-2">
            {status === 'pendente' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                <p className="text-yellow-500">Aguardando processamento</p>
              </>
            )}
            {status === 'processando' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <p className="text-blue-500">Processando</p>
              </>
            )}
            {status === 'sucesso' && (
              <p className="text-green-500">Transmitido com sucesso</p>
            )}
            {status === 'erro' && (
              <p className="text-red-500">Erro na transmissão</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
