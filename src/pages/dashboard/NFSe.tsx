
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const NFSePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [nfseCancelamento, setNfseCancelamento] = useState<string | null>(null);

  // Query para buscar as configurações da NFSe
  const { data: settings } = useQuery({
    queryKey: ["nfse-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nfse_sp_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: notas, isLoading, refetch } = useQuery({
    queryKey: ["nfse", searchTerm],
    queryFn: async () => {
      const query = supabase
        .from("nfse")
        .select(`
          *,
          client:client_id (
            name,
            document
          )
        `)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query.or(`client.name.ilike.%${searchTerm}%,client.document.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const handleEmitir = async (nfseId: string) => {
    try {
      // Verificar se as configurações obrigatórias estão presentes
      if (!settings?.usuario_emissor || !settings?.senha_emissor) {
        toast({
          variant: "destructive",
          title: "Erro ao emitir NFS-e",
          description: "Configurações obrigatórias não encontradas. Configure o usuário e senha do emissor nas configurações.",
        });
        return;
      }

      const { error } = await supabase.functions.invoke("process-nfse", {
        body: { nfseId },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "NFS-e enviada para processamento",
      });

      refetch();
    } catch (error: any) {
      console.error("Erro ao emitir NFS-e:", error);
      toast({
        variant: "destructive",
        title: "Erro ao emitir NFS-e",
        description: error.message || "Erro ao processar NFS-e",
      });
    }
  };

  const handleCancelar = async () => {
    if (!nfseCancelamento || !motivoCancelamento) return;

    try {
      const { error } = await supabase
        .from("nfse")
        .update({
          cancelada: true,
          motivo_cancelamento: motivoCancelamento,
          data_cancelamento: new Date().toISOString(),
          status_sefaz: "cancelada",
        })
        .eq("id", nfseCancelamento);

      if (error) throw error;

      await supabase.from("nfse_eventos").insert({
        nfse_id: nfseCancelamento,
        tipo_evento: "cancelamento",
        descricao: motivoCancelamento,
        status: "concluido",
      });

      toast({
        title: "NFS-e cancelada com sucesso",
      });

      setShowCancelDialog(false);
      setMotivoCancelamento("");
      setNfseCancelamento(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar NFS-e",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfigureClick = () => {
    navigate("/dashboard/service-order-settings");
  };

  const formatMoney = (value: number | null) => {
    if (value === null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {(!settings?.usuario_emissor || !settings?.senha_emissor) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Configure o usuário e senha do emissor nas configurações antes de emitir NFS-e.
            <Button
              variant="link"
              className="p-0 h-auto font-normal ml-2"
              onClick={handleConfigureClick}
            >
              Configurar agora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar notas fiscais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => navigate("/dashboard/nfse/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova NFS-e
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data Emissão</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : notas?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhuma nota fiscal encontrada
                </TableCell>
              </TableRow>
            ) : (
              notas?.map((nota) => (
                <TableRow key={nota.id}>
                  <TableCell>{nota.numero_nfse}</TableCell>
                  <TableCell>{nota.client?.name}</TableCell>
                  <TableCell>
                    {format(new Date(nota.data_emissao), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{formatMoney(nota.valor_total)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        nota.status_sefaz === "autorizada"
                          ? "bg-green-100 text-green-800"
                          : nota.status_sefaz === "rejeitada"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {nota.status_sefaz}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {nota.status_sefaz === "pendente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmitir(nota.id)}
                          disabled={!settings?.usuario_emissor || !settings?.senha_emissor}
                        >
                          Emitir
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNfseCancelamento(nota.id);
                          setShowCancelDialog(true);
                        }}
                        disabled={
                          nota.status_sefaz !== "autorizada" || nota.cancelada
                        }
                      >
                        Cancelar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NFS-e</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento da nota fiscal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do Cancelamento</Label>
              <Textarea
                id="motivo"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setMotivoCancelamento("");
                setNfseCancelamento(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCancelar} disabled={!motivoCancelamento}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NFSePage;
