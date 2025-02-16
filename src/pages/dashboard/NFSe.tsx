import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Send, File, Loader2, Mail, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface NFSe {
  id: string;
  numero_nfse: number;
  data_emissao: string;
  client_id: string;
  valor_servicos: number;
  status_sefaz: string;
  discriminacao_servicos: string;
  xml_envio: string;
  xml_retorno: string;
  pdf_url: string;
  clients: {
    name: string;
    email: string;
  };
  cancelada: boolean;
  data_cancelamento: string | null;
  motivo_cancelamento: string | null;
}

const NFSe = () => {
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [enviandoEmail, setEnviandoEmail] = useState<string | null>(null);
  const [gerandoPDF, setGerandoPDF] = useState<string | null>(null);
  const [notas, setNotas] = useState<NFSe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [xmlDialogOpen, setXmlDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedXml, setSelectedXml] = useState<{ envio: string; retorno: string } | null>(null);
  const [selectedNota, setSelectedNota] = useState<NFSe | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelando, setCancelando] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNFSe = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("nfse")
        .select(`
          id,
          numero_nfse,
          data_emissao,
          client_id,
          valor_servicos,
          status_sefaz,
          discriminacao_servicos,
          xml_envio,
          xml_retorno,
          pdf_url,
          cancelada,
          data_cancelamento,
          motivo_cancelamento,
          clients (
            name,
            email
          )
        `)
        .ilike("clients.name", `%${searchTerm}%`);

      if (error) throw error;

      setNotas(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar NFS-e",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToSEFAZ = async (id: string) => {
    try {
      setProcessando(id);
      const { error } = await supabase.functions.invoke("process-nfse", {
        body: { nfseId: id },
      });

      if (error) throw error;

      toast({
        title: "NFS-e enviada para processamento",
        description: "Acompanhe o status da transmissão.",
      });

      fetchNFSe();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar NFS-e",
        description: error.message,
      });
    } finally {
      setProcessando(null);
    }
  };

  const handleGeneratePDF = async (id: string) => {
    try {
      setGerandoPDF(id);
      const { data, error } = await supabase.functions.invoke("generate-nfse-pdf", {
        body: { nfseId: id },
      });

      if (error) throw error;

      const linkSource = data.pdf;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = `nfse_${id}.pdf`;
      downloadLink.click();
      
      toast({
        title: "PDF gerado com sucesso",
        description: "O download começará automaticamente.",
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: error.message,
      });
    } finally {
      setGerandoPDF(null);
    }
  };

  const handleResendEmail = async (id: string) => {
    try {
      setEnviandoEmail(id);
      const { error } = await supabase.functions.invoke("send-nfse-email", {
        body: { nfseId: id },
      });

      if (error) throw error;

      toast({
        title: "E-mail enviado com sucesso",
        description: "O documento foi enviado para o cliente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar e-mail",
        description: error.message,
      });
    } finally {
      setEnviandoEmail(null);
    }
  };

  const handleViewXML = (nota: NFSe) => {
    setSelectedXml({
      envio: nota.xml_envio,
      retorno: nota.xml_retorno
    });
    setXmlDialogOpen(true);
  };

  const handleViewDetails = (nota: NFSe) => {
    setSelectedNota(nota);
    setDetailsDialogOpen(true);
  };

  const handleCancelNFSe = async (id: string) => {
    try {
      setCancelando(id);
      const { error } = await supabase.functions.invoke("cancel-nfse", {
        body: { 
          nfseId: id,
          motivoCancelamento 
        },
      });

      if (error) throw error;

      toast({
        title: "NFS-e cancelada com sucesso",
        description: "A nota fiscal foi cancelada e não pode mais ser utilizada.",
      });

      fetchNFSe();
      setCancelDialogOpen(false);
      setMotivoCancelamento("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar NFS-e",
        description: error.message,
      });
    } finally {
      setCancelando(null);
    }
  };

  const handleOpenCancelDialog = (nota: NFSe) => {
    setSelectedNota(nota);
    setCancelDialogOpen(true);
  };

  const verificarStatusProcessamento = async () => {
    try {
      const { data: notasProcessando } = await supabase
        .from("nfse")
        .select("*")
        .eq("status_sefaz", "processando");

      if (notasProcessando && notasProcessando.length > 0) {
        for (const nota of notasProcessando) {
          const processandoHa = new Date().getTime() - new Date(nota.updated_at).getTime();
          if (processandoHa > 5 * 60 * 1000) {
            console.log(`Nota ${nota.numero_nfse} em processamento há muito tempo, verificando status...`);
            
            const { error } = await supabase.functions.invoke("process-nfse", {
              body: { nfseId: nota.id },
            });

            if (error) {
              console.error(`Erro ao verificar nota ${nota.numero_nfse}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao verificar notas em processamento:", error);
    }
  };

  useEffect(() => {
    fetchNFSe();
  }, [searchTerm]);

  useEffect(() => {
    verificarStatusProcessamento();

    const interval = setInterval(verificarStatusProcessamento, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "autorizada":
        return "default";
      case "rejeitada":
        return "destructive";
      case "processando":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Notas Fiscais de Serviço</h2>
        <Button onClick={() => console.log("Nova NFS-e")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova NFS-e
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar notas fiscais..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data Emissão</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : notas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhuma NFS-e encontrada
                </TableCell>
              </TableRow>
            ) : (
              notas.map((nota) => (
                <TableRow key={nota.id}>
                  <TableCell>{nota.numero_nfse}</TableCell>
                  <TableCell>
                    {new Date(nota.data_emissao).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{nota.clients?.name}</TableCell>
                  <TableCell>
                    {nota.valor_servicos.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={nota.cancelada ? "destructive" : getStatusBadgeVariant(nota.status_sefaz)}
                      className="flex w-fit items-center gap-1"
                    >
                      {nota.status_sefaz === "processando" && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {nota.cancelada ? "Cancelada" : nota.status_sefaz}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(nota)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>

                      {!nota.cancelada && (
                        <>
                          {nota.status_sefaz === "pendente" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendToSEFAZ(nota.id)}
                              disabled={processando === nota.id}
                            >
                              {processando === nota.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              Transmitir
                            </Button>
                          )}

                          {nota.status_sefaz === "autorizada" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewXML(nota)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                XML
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGeneratePDF(nota.id)}
                                disabled={gerandoPDF === nota.id}
                              >
                                {gerandoPDF === nota.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <File className="h-4 w-4 mr-2" />
                                )}
                                PDF
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendEmail(nota.id)}
                                disabled={enviandoEmail === nota.id}
                              >
                                {enviandoEmail === nota.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4 mr-2" />
                                )}
                                Email
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenCancelDialog(nota)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={xmlDialogOpen} onOpenChange={setXmlDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>XML da NFS-e</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">XML de Envio</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                {selectedXml?.envio}
              </pre>
            </div>
            <div>
              <h3 className="font-bold mb-2">XML de Retorno</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                {selectedXml?.retorno}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalhes da NFS-e</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {selectedNota && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informações Gerais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Número da Nota</p>
                      <p className="font-medium">{selectedNota.numero_nfse}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Emiss��o</p>
                      <p className="font-medium">
                        {new Date(selectedNota.data_emissao).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={getStatusBadgeVariant(selectedNota.status_sefaz)}>
                        {selectedNota.status_sefaz === "processando" && (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        {selectedNota.status_sefaz}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor dos Serviços</p>
                      <p className="font-medium">
                        {selectedNota.valor_servicos.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2">Dados do Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{selectedNota.clients?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedNota.clients?.email}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2">Discriminação dos Serviços</h3>
                  <p className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {selectedNota.discriminacao_servicos}
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar NFS-e</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta NFS-e? Esta ação não pode ser desfeita.
              <div className="mt-4">
                <label className="text-sm font-medium">
                  Motivo do Cancelamento
                </label>
                <Textarea
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Digite o motivo do cancelamento..."
                  className="mt-1.5"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedNota && handleCancelNFSe(selectedNota.id)}
              disabled={!motivoCancelamento || cancelando === selectedNota?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelando === selectedNota?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NFSe;
