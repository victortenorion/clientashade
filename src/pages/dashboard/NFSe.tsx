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
  const [nfseToEdit, setNfseToEdit] = useState<string | null>(null);

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
    }
  });

  const { data: nfseToEditData } = useQuery({
    queryKey: ["nfse", nfseToEdit],
    queryFn: async () => {
      if (!nfseToEdit) return null;
      
      const { data, error } = await supabase
        .from("nfse")
        .select("*")
        .eq("id", nfseToEdit)
        .single();

      if (error) throw error;
      return data as NFSe;
    },
    enabled: !!nfseToEdit,
  });

  const handleDeleteNFSe = async (nfseId: string) => {
    try {
      console.log('Iniciando exclusão da NFS-e:', nfseId);

      // Primeiro verificar se a NFS-e existe
      const { data: nfse, error: checkError } = await supabase
        .from("nfse")
        .select("*")
        .eq("id", nfseId)
        .single();

      if (checkError) {
        throw new Error("NFS-e não encontrada");
      }

      // Excluir registros relacionados em sequência
      await supabase
        .from("nfse_eventos")
        .delete()
        .eq("nfse_id", nfseId);

      await supabase
        .from("nfse_sefaz_logs")
        .delete()
        .eq("nfse_id", nfseId);

      await supabase
        .from("sefaz_transmission_queue")
        .delete()
        .eq("documento_id", nfseId)
        .eq("tipo", "nfse");

      // Por fim, excluir a NFS-e
      const { error: deleteError } = await supabase
        .from("nfse")
        .delete()
        .eq("id", nfseId);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar o cache e a interface
      queryClient.invalidateQueries({ queryKey: ["nfse"] });

      toast({
        title: "NFS-e excluída com sucesso"
      });

    } catch (error: any) {
      console.error('Erro ao excluir NFS-e:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir NFS-e",
        description: error.message
      });
    }
  };

  const handleSendToSefaz = async (nfseId: string) => {
    try {
      const { data: config, error: configError } = await supabase
        .from("nfse_config")
        .select("*")
        .limit(1)
        .maybeSingle();

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
        request_payload: { nfseId },
        response_payload: null
      });

      const { error: updateError } = await supabase
        .from("nfse")
        .update({ status_sefaz: "enviando" })
        .eq("id", nfseId);

      if (updateError) throw updateError;

      const { data: processResponse, error: processError } = await supabase.functions.invoke('process-nfse', {
        body: { nfseId }
      });

      if (processError) throw processError;

      console.log('Resposta do processamento:', processResponse);

      await supabase.from("nfse_sefaz_logs").insert({
        nfse_id: nfseId,
        status: "success",
        message: "NFS-e enviada para processamento com sucesso",
        request_payload: { nfseId },
        response_payload: processResponse
      });

      toast({
        title: "NFS-e enviada para processamento",
        description: `RPS número ${processResponse?.rps?.numero} gerado com sucesso.`,
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
        request_payload: { nfseId },
        response_payload: { error: error.message }
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

      if (nfseToEdit) {
        // Atualizar NFS-e existente
        const { error: updateError } = await supabase
          .from("nfse")
          .update({
            client_id: formData.client_id,
            codigo_servico: formData.codigo_servico,
            discriminacao_servicos: formData.discriminacao_servicos,
            valor_servicos: formData.valor_servicos,
            data_competencia: formData.data_competencia,
            observacoes: formData.observacoes,
            deducoes: formData.deducoes || 0,
            natureza_operacao: formData.natureza_operacao,
            municipio_prestacao: formData.municipio_prestacao,
            cnae: formData.cnae,
            retencao_ir: formData.retencao_ir,
            percentual_ir: formData.percentual_ir,
            retencao_iss: formData.retencao_iss,
            desconto_iss: formData.desconto_iss,
            retencao_inss: formData.retencao_inss,
            retencao_pis_cofins_csll: formData.retencao_pis_cofins_csll,
            percentual_tributos_ibpt: formData.percentual_tributos_ibpt,
            desconto_incondicional: formData.desconto_incondicional,
            vendedor_id: formData.vendedor_id,
            comissao_percentual: formData.comissao_percentual,
            numero_rps: formData.numero_rps,
            serie_rps: formData.serie_rps,
          })
          .eq("id", nfseToEdit);

        if (updateError) throw updateError;

        toast({
          title: "NFS-e atualizada com sucesso",
        });
      } else {
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
      }

      setNfseToEdit(null);
      setShowEmissaoDialog(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar NFS-e",
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

  const handleEditNFSe = (nfseId: string) => {
    setNfseToEdit(nfseId);
    setSelectedNFSeId(null);
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
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditNFSe(nota.id)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {nota.status_sefaz === "pendente" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleSendToSefaz(nota.id)}
                          title="Enviar NFS-e"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
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

                      {(nota.status_sefaz === "pendente" || nota.cancelada) && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteNFSe(nota.id)}
                          title="Excluir"
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
        onEdit={handleEditNFSe}
      />

      <Dialog open={!!nfseToEdit} onOpenChange={() => setNfseToEdit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar NFS-e</DialogTitle>
          </DialogHeader>
          <NFSeForm
            onSubmit={handleEmitirNFSe}
            onCancel={() => setNfseToEdit(null)}
            isLoading={isEmitindo}
            submitButtonText="Salvar Alterações"
            initialData={nfseToEditData ? {
              client_id: nfseToEditData.client_id,
              codigo_servico: nfseToEditData.codigo_servico,
              discriminacao_servicos: nfseToEditData.discriminacao_servicos,
              valor_servicos: nfseToEditData.valor_servicos,
              data_competencia: nfseToEditData.data_competencia,
              observacoes: nfseToEditData.observacoes || "",
              deducoes: nfseToEditData.deducoes || 0,
              natureza_operacao: nfseToEditData.natureza_operacao || "1",
              municipio_prestacao: nfseToEditData.municipio_prestacao || "",
              cnae: nfseToEditData.cnae || "",
              retencao_ir: nfseToEditData.retencao_ir || false,
              percentual_ir: nfseToEditData.percentual_ir || 0,
              retencao_iss: nfseToEditData.retencao_iss || false,
              desconto_iss: nfseToEditData.desconto_iss || false,
              retencao_inss: nfseToEditData.retencao_inss || false,
              retencao_pis_cofins_csll: nfseToEditData.retencao_pis_cofins_csll || false,
              percentual_tributos_ibpt: nfseToEditData.percentual_tributos_ibpt || 0,
              desconto_incondicional: nfseToEditData.desconto_incondicional || 0,
              vendedor_id: nfseToEditData.vendedor_id || "",
              comissao_percentual: nfseToEditData.comissao_percentual || 0,
              numero_rps: nfseToEditData.numero_rps || "",
              serie_rps: nfseToEditData.serie_rps || "1",
            } : undefined}
          />
        </DialogContent>
      </Dialog>

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
