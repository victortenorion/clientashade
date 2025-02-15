import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SefazLog {
  id: string;
  nfse_id: string;
  status: "processing" | "success" | "error";
  message: string;
  created_at: string;
  request_payload: Record<string, any>;
  response_payload: Record<string, any>;
}

export interface NFSeSefazLogsProps {
  nfseId: string | null;
  onClose: () => void;
  isOpen?: boolean;
}

export const NFSeSefazLogs: React.FC<NFSeSefazLogsProps> = ({
  nfseId,
  onClose,
  isOpen = true
}) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['sefaz-logs', nfseId],
    queryFn: async () => {
      if (!nfseId) return [];

      const { data, error } = await supabase
        .from('nfse_sefaz_logs')
        .select('*')
        .eq('nfse_id', nfseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar logs:', error);
        throw error;
      }

      return (data || []) as SefazLog[];
    },
    enabled: !!nfseId,
  });

  const formatJson = (json: Record<string, any>) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return 'Invalid JSON';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logs SEFAZ</DialogTitle>
        </DialogHeader>
        
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Payload Enviado</TableHead>
                <TableHead>Resposta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : logs && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] break-words">{log.message}</TableCell>
                    <TableCell>
                      <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {formatJson(log.request_payload)}
                      </pre>
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {formatJson(log.response_payload)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
