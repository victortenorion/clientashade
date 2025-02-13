
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
import { NFCe } from "./types/nfce.types";
import { format } from "date-fns";
import { Plus } from "lucide-react";
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

const NFCePage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEmitindo, setIsEmitindo] = useState(false);
  const [showEmissaoDialog, setShowEmissaoDialog] = useState(false);
  const [selectedNFCeId, setSelectedNFCeId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [nfceCancelamento, setNfceCancelamento] = useState<string | null>(null);

  const { data: notas, isLoading, refetch } = useQuery({
    queryKey: ["nfce", searchTerm],
    queryFn: async () => {
      const query = supabase
        .from("nfce")
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

  const handleImprimirDANFE = async (nfceId: string) => {
    // Esta função será implementada posteriormente quando tivermos a API de impressão
    toast({
      title: "Impressão",
      description: "Funcionalidade de impressão será implementada em breve.",
    });
  };

  const handleCancelarNFCe = async () => {
    if (!nfceCancelamento || !motivoCancelamento) return;

    try {
      const { error } = await supabase
        .from("nfce")
        .update({
          cancelada: true,
          motivo_cancelamento: motivoCancelamento,
          data_cancelamento: new Date().toISOString(),
          status_sefaz: "cancelada"
        })
        .eq("id", nfceCancelamento);

      if (error) throw error;

      await supabase.from("nfce_eventos").insert({
        nfce_id: nfceCancelamento,
        tipo_evento: "cancelamento",
        descricao: motivoCancelamento,
        status: "concluido"
      });

      toast({
        title: "NFC-e cancelada com sucesso",
      });

      setShowCancelDialog(false);
      setMotivoCancelamento("");
      setNfceCancelamento(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar NFC-e",
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
          Nova NFC-e
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
              notas?.map((nota: NFCe) => (
                <TableRow key={nota.id}>
                  <TableCell>{nota.numero_nfce}</TableCell>
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
                        onClick={() => setSelectedNFCeId(nota.id)}
                      >
                        Visualizar
                      </Button>
                      {nota.status_sefaz === "autorizada" && !nota.cancelada && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleImprimirDANFE(nota.id)}
                          >
                            DANFE
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNfceCancelamento(nota.id);
                              setShowCancelDialog(true);
                            }}
                          >
                            Cancelar
                          </Button>
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

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NFC-e</DialogTitle>
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
                setNfceCancelamento(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCancelarNFCe}
              disabled={!motivoCancelamento}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NFCePage;
