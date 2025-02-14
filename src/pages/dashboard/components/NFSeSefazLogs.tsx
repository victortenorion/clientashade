
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface Props {
  nfseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NFSeSefazLogs = ({ nfseId, isOpen, onClose }: Props) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["nfse_sefaz_logs", nfseId],
    queryFn: async () => {
      if (!nfseId) return [];
      
      const { data, error } = await supabase
        .from("nfse_sefaz_logs")
        .select("*")
        .eq("nfse_id", nfseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!nfseId && isOpen,
    refetchInterval: (data) => {
      // Atualiza a cada 5 segundos se houver algum log com status 'processing'
      const hasProcessing = data?.some((log) => log.status === "processing");
      return hasProcessing ? 5000 : false;
    },
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logs de Envio para SEFAZ</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando logs...</span>
          </div>
        ) : !logs?.length ? (
          <Alert>
            <AlertDescription>
              Nenhum log encontrado para esta NFS-e.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(
                        log.status
                      )}`}
                    >
                      {log.status === "processing"
                        ? "Processando"
                        : log.status === "success"
                        ? "Sucesso"
                        : "Erro"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xl break-words">
                    {log.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
