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
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NFSeForm } from "./components/NFSeForm";
import { NFSeView } from "./components/NFSeView";

const NFSePage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEmitindo, setIsEmitindo] = useState(false);
  const [showEmissaoDialog, setShowEmissaoDialog] = useState(false);
  const [selectedNFSeId, setSelectedNFSeId] = useState<string | null>(null);

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
  });

  const handleEmitirNFSe = async (formData: NFSeFormData) => {
    try {
      setIsEmitindo(true);

      // Verificar configurações do SEFAZ
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

      // Buscar informações do serviço
      const { data: servico, error: servicoError } = await supabase
        .from("nfse_servicos")
        .select("*")
        .eq("codigo", formData.codigo_servico)
        .maybeSingle();

      if (servicoError) throw servicoError;

      // Inserir NFS-e
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
                <TableRow key={nota.id}>
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
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedNFSeId(nota.id)}
                      >
                        Visualizar
                      </Button>
                      {nota.status_sefaz === "autorizada" && (
                        <Button variant="outline" size="sm">
                          Imprimir
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showEmissaoDialog} onOpenChange={setShowEmissaoDialog}>
        <DialogContent className="max-w-3xl">
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

      <NFSeView
        nfseId={selectedNFSeId}
        onClose={() => setSelectedNFSeId(null)}
      />
    </div>
  );
};

export default NFSePage;
