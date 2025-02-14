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
import { NFSe, NFSeFormData } from "./types/nfse.types";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Send, XCircle, Printer, List } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { NFSeForm } from "./components/NFSeForm";
import { NFSeView } from "./components/NFSeView";
import { NFSeSefazLogs } from "./components/NFSeSefazLogs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

const NFSePage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEmitindo, setIsEmitindo] = useState(false);
  const [showEmissaoDialog, setShowEmissaoDialog] = useState(false);
  const [selectedNFSeId, setSelectedNFSeId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [nfseCancelamento, setNfseCancelamento] = useState<string | null>(null);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedNFSeIdForLogs, setSelectedNFSeIdForLogs] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: notas, isLoading, refetch } = useQuery({
    queryKey: ["nfse", searchTerm],
    queryFn: async () => {
      const query = supabase
        .from("nfse")
        .select(`
          *,
          clients (
            name,
            document
          )
        `)
        .order("data_emissao", { ascending: false });

      if (searchTerm) {
        query.or(`clients.name.ilike.%${searchTerm}%,clients.document.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const { data: nfseConfig } = useQuery({
    queryKey: ["nfse_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nfse_config")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleSendToSefaz = async (nfseId: string) => {
    try {
      const { data: config, error: configError } = await supabase
        .from("nfse_config")
        .select("*")
        .limit(1)
        .single();

      if (configError) throw configError;
      if (!config) {
        toast({
          title: "Erro ao emitir NFS-e",
          description: "Configurações da NFS-e não encontradas.",
          variant: "destructive",
        });
        return;
      }

      if (!config.permite_emissao_sem_certificado && !config.certificado_digital) {
        toast({
          title: "Erro ao emitir NFS-e",
          description: "Configure o certificado digital antes de emitir notas fiscais.",
          variant: "destructive",
        });
        return;
      }

      const { error: queueError } = await supabase
        .from('sefaz_transmission_queue')
        .insert({
          tipo: 'nfse',
          documento_id: nfseId,
          status: 'pendente'
        });

      if (queueError) throw queueError;

      await supabase.from("nfse_sefaz_logs").insert({
        nfse_id: nfseId,
        status: "processing",
        message: "Iniciando envio para SEFAZ",
      });

      const { error: updateError } = await supabase
        .from("nfse")
        .update({ status_sefaz: "enviando" })
        .eq("id", nfseId);

      if (updateError) throw updateError;

      const { error: processError } = await supabase.functions.invoke('process-nfse', {
        body: { nfseId }
      });

      if (processError) throw processError;

      await supabase.from("nfse_sefaz_logs").insert({
        nfse_id: nfseId,
        status: "success",
        message: "NFS-e enviada para processamento com sucesso",
      });

      toast({
        title: "NFS-e enviada para processamento",
        description: "Em breve o status será atualizado.",
      });

      setSelectedNFSeIdForLogs(nfseId);
      setShowLogsDialog(true);

      refetch();
    } catch (error: any) {
      console.error('Erro ao enviar NFSe:', error);
      
      await supabase.from("nfse_sefaz_logs").insert({
        nfse_id: nfseId,
        status: "error",
        message: error.message,
      });

      toast({
        title: "Erro ao enviar para SEFAZ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEmitirNFSe = async (formData: NFSeFormData) => {
    try {
      setIsEmitindo(true);

      const { data: config, error: configError } = await supabase
        .from("nfse_config")
        .select("*")
        .maybeSingle();

      if (configError) throw configError;

      if (!config || !config.certificado_digital) {
        toast({
          title: "Erro ao emitir NFS-e",
          description: "Configure o certificado digital antes de emitir notas fiscais.",
          variant: "destructive",
        });
        return;
      }

      const { data: servico, error: servicoError } = await supabase
        .from("nfse_servicos")
        .select("*")
        .eq("codigo", formData.codigo_servico)
        .maybeSingle();

      if (servicoError) throw servicoError;

      const { data: nfse, error: nfseError } = await supabase
        .from("nfse")
        .insert({
          client_id: formData.client_id,
          codigo_servico: formData.codigo_servico,
          discriminacao_servicos: formData.discriminacao_servicos,
          valor_servicos: formData.valor_servicos,
          data_competencia: formData.data_competencia,
          observacoes: formData.observacoes,
          deducoes: formData.deducoes || 0,
          aliquota_iss: servico?.aliquota_iss,
          ambiente: config.ambiente,
          status_sefaz: "pendente",
        })
        .select()
        .maybeSingle();

      if (nfseError) throw nfseError;

      toast({
        title: "NFS-e gerada com sucesso",
        description: `NFS-e número ${nfse.numero_nfse} foi gerada e está aguardando processamento.`,
      });

      setShowEmissaoDialog(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao emitir NFS-e",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEmitindo(false);
    }
  };

  const handleCancelarNFSe = async () => {
    if (!nfseCancelamento || !motivoCancelamento) return;

    try {
      const { error } = await supabase
        .from("nfse")
        .update({
          cancelada: true,
          motivo_cancelamento: motivoCancelamento,
          data_cancelamento: new Date().toISOString(),
          status_sefaz: "cancelada"
        })
        .eq("id", nfseCancelamento);

      if (error) throw error;

      await supabase.from("nfse_eventos").insert({
        nfse_id: nfseCancelamento,
        tipo_evento: "cancelamento",
        descricao: motivoCancelamento,
        status: "concluido"
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

  const handleImprimirNFSe = async (nfseId: string) => {
    toast({
      title: "Impressão",
      description: "Funcionalidade de impressão será implementada em breve.",
    });
  };

  const handleEditNFSe = async (nfseId: string) => {
    toast({
      title: "Em desenvolvimento",
      description: "A funcionalidade de edição será implementada em breve.",
    });
  };

  const handleDeleteNFSe = async (nfseId: string) => {
    try {
      const { data: nfse, error: nfseError } = await supabase
        .from("nfse")
        .select("status_sefaz, cancelada")
        .eq("id", nfseId)
        .single();

      if (nfseError) throw nfseError;

      if (nfse.status_sefaz !== "pendente" && !nfse.cancelada) {
        toast({
          variant: "destructive",
          title: "Erro ao excluir NFS-e",
          description: "Apenas NFS-e pendentes ou canceladas podem ser excluídas",
        });
        return;
      }

      const promises = [
        supabase
          .from("nfse_eventos")
          .delete()
          .eq("nfse_id", nfseId),
        
        supabase
          .from("nfse_sefaz_logs")
          .delete()
          .eq("nfse_id", nfseId),
        
        supabase
          .from("sefaz_transmission_queue")
          .delete()
          .eq("documento_id", nfseId)
          .eq("tipo", "nfse")
      ];

      await Promise.all(promises);

      const { error: deleteError } = await supabase
        .from("nfse")
        .delete()
        .eq("id", nfseId);

      if (deleteError) throw deleteError;

      await queryClient.invalidateQueries({ queryKey: ["nfse"] });
      
      queryClient.setQueryData(["nfse", searchTerm], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((nota: any) => nota.id !== nfseId);
      });

      toast({
        title: "NFS-e excluída com sucesso",
      });

      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir NFS-e:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir NFS-e",
        description: error.message,
      });
    }
  };

  const handleCancelEnvio = async (nfseId: string) => {
    try {
      const { error: nfseError } = await supabase
        .from("nfse")
        .update({ status_sefaz: "pendente" })
        .eq("id", nfseId);

      if (nfseError) throw nfseError;

      const { error: queueError } = await supabase
        .from("sefaz_transmission_queue")
        .delete()
        .eq("documento_id", nfseId)
        .eq("tipo", "nfse");

      if (queueError) throw queueError;

      toast({
        title: "Envio cancelado",
        description: "A NFS-e voltou para o status pendente.",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar envio",
        description: error.message,
        variant: "destructive",
      });
    }
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
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar notas fiscais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowEmissaoDialog(true)}>
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
              notas?.map((nota: any) => (
                <TableRow 
                  key={nota.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedNFSeId(nota.id)}
                >
                  <TableCell>{nota.numero_nfse}</TableCell>
                  <TableCell>{nota.clients?.name}</TableCell>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {nota.status_sefaz === "pendente" && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditNFSe(nota.id)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteNFSe(nota.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleSendToSefaz(nota.id)}
                            title="Enviar para SEFAZ"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {nota.status_sefaz === "enviando" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCancelEnvio(nota.id)}
                          title="Cancelar envio"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}

                      {(nota.status_sefaz === "processado" || nota.status_sefaz === "autorizada") && !nota.cancelada && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleImprimirNFSe(nota.id)}
                            title="Imprimir"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setNfseCancelamento(nota.id);
                              setShowCancelDialog(true);
                            }}
                            title="Cancelar NFS-e"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {nota.cancelada && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteNFSe(nota.id)}
                          title="Excluir NFS-e cancelada"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedNFSeIdForLogs(nota.id);
                          setShowLogsDialog(true);
                        }}
                        title="Ver Logs"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showEmissaoDialog} onOpenChange={setShowEmissaoDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emitir Nova NFS-e</DialogTitle>
          </DialogHeader>
          <NFSeForm
            onSubmit={handleEmitirNFSe}
            onCancel={() => setShowEmissaoDialog(false)}
            isLoading={isEmitindo}
          />
        </DialogContent>
      </Dialog>

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
            <Button
              onClick={handleCancelarNFSe}
              disabled={!motivoCancelamento}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NFSeView
        nfseId={selectedNFSeId}
        onClose={() => setSelectedNFSeId(null)}
      />

      <NFSeSefazLogs
        nfseId={selectedNFSeIdForLogs}
        isOpen={showLogsDialog}
        onClose={() => {
          setShowLogsDialog(false);
          setSelectedNFSeIdForLogs(null);
        }}
      />
    </div>
  );
};

export default NFSePage;
