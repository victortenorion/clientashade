
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
import { Plus, FilePdf, FileText, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NFSe {
  id: string;
  numero_nfse: number;
  data_emissao: string;
  client_id: string;
  valor_servicos: number;
  status_sefaz: string;
  discriminacao_servicos: string;
  clients: {
    name: string;
  };
}

const NFSe = () => {
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<NFSe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
          clients (
            name
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
      const { error } = await supabase.functions.invoke('transmit-nfse', {
        body: { nfseId: id }
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
    }
  };

  useEffect(() => {
    fetchNFSe();
  }, [searchTerm]);

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
                  Carregando...
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
                      variant={nota.status_sefaz === "autorizada" ? "default" : 
                              nota.status_sefaz === "rejeitada" ? "destructive" : 
                              "secondary"}
                    >
                      {nota.status_sefaz}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {nota.status_sefaz === "pendente" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendToSEFAZ(nota.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Transmitir
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log("Visualizar XML")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      XML
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log("Visualizar PDF")}
                    >
                      <FilePdf className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default NFSe;
