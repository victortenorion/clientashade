import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { NFSe, NFSeEvento } from "../types/nfse.types";
import { FileText, Pencil, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  nfseId: string | null;
  onClose: () => void;
  onEdit?: (nfseId: string) => void;
}

export const NFSeView = ({ nfseId, onClose, onEdit }: Props) => {
  const { toast } = useToast();

  const { data: nfse, isLoading: isLoadingNFSe } = useQuery({
    queryKey: ["nfse", nfseId],
    queryFn: async () => {
      if (!nfseId) return null;
      
      const { data, error } = await supabase
        .from("nfse")
        .select(`
          *,
          clients (
            name,
            document,
            email,
            street,
            street_number,
            complement,
            neighborhood,
            city,
            state,
            zip_code
          )
        `)
        .eq("id", nfseId)
        .single();

      if (error) throw error;
      return data as NFSe & { clients: any };
    },
    enabled: !!nfseId,
  });

  const { data: eventos, isLoading: isLoadingEventos } = useQuery({
    queryKey: ["nfse_eventos", nfseId],
    queryFn: async () => {
      if (!nfseId) return [];
      
      const { data, error } = await supabase
        .from("nfse_eventos")
        .select("*")
        .eq("nfse_id", nfseId)
        .order("data_evento", { ascending: false });

      if (error) throw error;
      return data as NFSeEvento[];
    },
    enabled: !!nfseId,
  });

  const handlePrint = () => {
    if (nfse?.status_sefaz !== 'autorizada') {
      toast({
        title: "Não é possível imprimir",
        description: "A NFS-e precisa estar autorizada para ser impressa.",
        variant: "destructive"
      });
      return;
    }

    if (!nfse.codigo_verificacao || !nfse.inscricao_prestador) {
      toast({
        title: "Dados insuficientes",
        description: "Não foi possível gerar o link de impressão. Verifique se o código de verificação e inscrição do prestador estão presentes.",
        variant: "destructive"
      });
      return;
    }

    const url = `https://nfe.prefeitura.sp.gov.br/contribuinte/notaprint.aspx?inscricao=${nfse.inscricao_prestador}&nf=${nfse.numero_nfse}&verificacao=${nfse.codigo_verificacao}`;
    window.open(url, '_blank');
  };

  const handleEdit = () => {
    if (nfseId && onEdit) {
      onEdit(nfseId);
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
    <Dialog open={!!nfseId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            NFS-e Nº {nfse?.numero_nfse}
          </DialogTitle>
        </DialogHeader>

        {isLoadingNFSe ? (
          <div className="text-center py-4">Carregando...</div>
        ) : !nfse ? (
          <div className="text-center py-4">NFS-e não encontrada</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Prestador</h3>
                <div className="text-sm space-y-1">
                  <p>Nome: {nfse.clients?.name}</p>
                  <p>CNPJ/CPF: {nfse.clients?.document}</p>
                  <p>
                    Endereço: {nfse.clients?.street}, {nfse.clients?.street_number}
                    {nfse.clients?.complement && ` - ${nfse.clients?.complement}`}
                  </p>
                  <p>
                    {nfse.clients?.neighborhood} - {nfse.clients?.city}/
                    {nfse.clients?.state}
                  </p>
                  <p>CEP: {nfse.clients?.zip_code}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Informações da Nota</h3>
                <div className="text-sm space-y-1">
                  <p>
                    Data de Emissão:{" "}
                    {format(new Date(nfse.data_emissao), "dd/MM/yyyy HH:mm")}
                  </p>
                  <p>
                    Competência:{" "}
                    {format(new Date(nfse.data_competencia), "MM/yyyy")}
                  </p>
                  <p>Código do Serviço: {nfse.codigo_servico}</p>
                  <p>Status SEFAZ: {nfse.status_sefaz}</p>
                  <p>Status Transmissão: {nfse.status_transmissao}</p>
                  <p>Ambiente: {nfse.ambiente}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Discriminação dos Serviços</h3>
              <p className="text-sm whitespace-pre-wrap">
                {nfse.discriminacao_servicos}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Valores</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>Valor dos Serviços: {formatMoney(nfse.valor_servicos)}</p>
                  <p>Deduções: {formatMoney(nfse.deducoes)}</p>
                  <p>Base de Cálculo: {formatMoney(nfse.base_calculo)}</p>
                </div>
                <div>
                  <p>Alíquota ISS: {nfse.aliquota_iss}%</p>
                  <p>Valor ISS: {formatMoney(nfse.valor_iss)}</p>
                  <p>Valor Total: {formatMoney(nfse.valor_total)}</p>
                </div>
              </div>
            </div>

            {nfse.observacoes && (
              <div>
                <h3 className="font-semibold mb-2">Observações</h3>
                <p className="text-sm whitespace-pre-wrap">{nfse.observacoes}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Histórico de Eventos</h3>
              {isLoadingEventos ? (
                <div className="text-center py-4">Carregando eventos...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventos?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Nenhum evento registrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      eventos?.map((evento) => (
                        <TableRow key={evento.id}>
                          <TableCell>
                            {format(
                              new Date(evento.data_evento),
                              "dd/MM/yyyy HH:mm"
                            )}
                          </TableCell>
                          <TableCell>{evento.tipo_evento}</TableCell>
                          <TableCell>{evento.status}</TableCell>
                          <TableCell>{evento.descricao}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={nfse?.status_sefaz !== 'autorizada'}
          >
            {nfse?.status_sefaz === 'autorizada' ? (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Imprimir no Portal
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Visualizar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
