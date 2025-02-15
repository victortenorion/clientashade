import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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
import { Plus, Pencil, Trash2, Send, XCircle, Printer, List, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

interface ProcessNFSeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const NFSePage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEmitindo, setIsEmitindo] = useState(false);
  const [showEmissaoDialog, setShowEmissaoDialog] = useState(false);
  const [selectedNFSeId, setSelectedNFSeId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [nfceCancelamento, setNfceCancelamento] = useState<string | null>(null);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedNFSeIdForLogs, setSelectedNFSeIdForLogs] = useState<string | null>(null);
  const [nfseToEdit, setNfseToEdit] = useState<NFSeFormData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [nfseToDelete, setNfseToDelete] = useState<string | null>(null);
  const [motivoExclusao, setMotivoExclusao] = useState("");

  const queryClient = useQueryClient();

  const { data: notas, isLoading } = useQuery<NFSe[], PostgrestError>({
    queryKey: ["nfse", searchTerm],
    queryFn: async () => {
      const query = supabase
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
        .order("data_emissao", { ascending: false });

      if (searchTerm) {
        query.or(`clients.name.ilike.%${searchTerm}%,clients.document.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as NFSe[];
    },
    refetchInterval: 5000
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["nfse"] });
  };

  const handleSendToSefaz = async (nfseId: string) => {
    try {
      setIsEmitindo(true);
      console.log("Enviando NFS-e para processamento...", { nfseId });

      const { data, error } = await supabase.functions.invoke<ProcessNFSeResponse>('process-nfse', {
        body: { nfseId }
      });

      console.log("Resposta do processamento:", { data, error });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao processar NFS-e');
      }

      toast({
        title: "NFS-e enviada para processamento",
        description: "Acompanhe o status do processamento nos logs.",
      });

      refreshData();
      setSelectedNFSeIdForLogs(nfseId);
      setShowLogsDialog(true);
    } catch (error: any) {
      console.error('Erro ao enviar NFSe:', error);
      toast({
        title: "Erro ao enviar NFS-e",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEmitindo(false);
    }
  };

  const handleEditNFSe = async (nfseId: string) => {
    try {
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

      const formData: NFSeFormData = {
        id: data.id,
        client_id: data.client_id,
        codigo_servico: data.codigo_servico,
        discriminacao_servicos: data.discriminacao_servicos,
        valor_servicos: data.valor_servicos,
        data_competencia: data.data_competencia,
        deducoes: data.deducoes || 0,
        observacoes: data.observacoes || "",
        natureza_operacao: data.natureza_operacao || "1",
        municipio_prestacao: data.municipio_prestacao || "",
        cnae: data.cnae || "",
        retencao_ir: data.retencao_ir || false,
        percentual_ir: data.percentual_ir || 0,
        retencao_iss: data.retencao_iss || false,
        desconto_iss: data.desconto_iss || false,
        retencao_inss: data.retencao_inss || false,
        retencao_pis_cofins_csll: data.retencao_pis_cofins_csll || false,
        percentual_tributos_ibpt: data.percentual_tributos_ibpt || 0,
        desconto_incondicional: data.desconto_incondicional || 0,
        vendedor_id: data.vendedor_id || "",
        comissao_percentual: data.comissao_percentual || 0,
        numero_rps: data.numero_rps || "",
        serie_rps: data.serie_rps || "1",
        responsavel_retencao: data.responsavel_retencao || "cliente",
        local_servico: data.local_servico || "tomador",
        tributacao_rps: data.tributacao_rps || "T",
        enviar_email_tomador: data.enviar_email_tomador ?? true,
        enviar_email_intermediario: data.enviar_email_intermediario ?? false,
        intermediario_servico: data.intermediario_servico ?? false,
        aliquota_pis: data.aliquota_pis || 0,
        aliquota_cofins: data.aliquota_cofins || 0,
        aliquota_csll: data.aliquota_csll || 0,
        outras_retencoes: data.outras_retencoes || 0,
        tipo_rps: data.tipo_rps || "RPS",
        tipo_documento_prestador: data.tipo_documento_prestador || "2",
        tipo_endereco_prestador: data.tipo_endereco_prestador || "R",
        tipo_documento_tomador: data.tipo_documento_tomador || "2",
        tipo_endereco_tomador: data.tipo_endereco_tomador || "R",
        iss_retido: data.iss_retido || "N",
        situacao_nota: data.situacao_nota || "T",
        opcao_simples: data.opcao_simples || "4",
        status_sefaz: data.status_sefaz || "pendente",
        status_transmissao: data.status_transmissao || "pendente",
        valor_total: data.valor_total || 0,
        valor_iss: data.valor_iss || 0,
        aliquota_iss: data.aliquota_iss || 0,
        valor_deducoes: data.valor_deducoes || 0,
        valor_pis: data.valor_pis || 0,
        valor_cofins: data.valor_cofins || 0,
        valor_inss: data.valor_inss || 0,
        valor_ir: data.valor_ir || 0,
        valor_csll: data.valor_csll || 0,
        valor_carga_tributaria: data.valor_carga_tributaria || 0,
        percentual_carga_tributaria: data.percentual_carga_tributaria || 0,
        data_emissao: data.data_emissao || new Date().toISOString().split("T")[0],
        data_fato_gerador: data.data_fato_gerador || new Date().toISOString().split("T")[0],
        inscricao_prestador: data.inscricao_prestador || "",
        documento_prestador: data.documento_prestador || "",
        razao_social_prestador: data.razao_social_prestador || "",
        endereco_prestador: data.endereco_prestador || "",
        numero_endereco_prestador: data.numero_endereco_prestador || "",
        complemento_endereco_prestador: data.complemento_endereco_prestador || "",
        bairro_prestador: data.bairro_prestador || "",
        cidade_prestador: data.cidade_prestador || "",
        uf_prestador: data.uf_prestador || "",
        cep_prestador: data.cep_prestador || "",
        email_prestador: data.email_prestador || "",
        documento_tomador: data.documento_tomador || "",
        razao_social_tomador: data.razao_social_tomador || "",
        endereco_tomador: data.endereco_tomador || "",
        numero_endereco_tomador: data.numero_endereco_tomador || "",
        complemento_endereco_tomador: data.complemento_endereco_tomador || "",
        bairro_tomador: data.bairro_tomador || "",
        cidade_tomador: data.cidade_tomador || "",
        uf_tomador: data.uf_tomador || "",
        cep_tomador: data.cep_tomador || "",
        email_tomador: data.email_tomador || "",
        codigo_regime_especial_tributacao: data.codigo_regime_especial_tributacao || "",
        tipo_regime_especial: data.tipo_regime_especial || "",
        codigo_servico_municipio: data.codigo_servico_municipio || "",
        unidade_codigo: data.unidade_codigo || "",
        codigo_tributacao_municipio: data.codigo_tributacao_municipio || "",
        codigo_proprio: data.codigo_proprio || "",
        inscricao_estadual_prestador: data.inscricao_estadual_prestador || "",
        inscricao_municipal_prestador: data.inscricao_municipal_prestador || "",
        codigo_pais_prestador: data.codigo_pais_prestador || "1058",
        codigo_pais_tomador: data.codigo_pais_tomador || "1058",
        regime_especial: data.regime_especial || "",
        fonte_tributos: data.fonte_tributos || "I",
        tipo_servico: data.tipo_servico || "P"
      };

      setNfseToEdit(formData);
      setSelectedNFSeId(null);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar NFS-e",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEmitirNFSe = async (formData: NFSeFormData) => {
    try {
      setIsEmitindo(true);

      if (!formData.client_id) {
        throw new Error("ID do cliente é obrigatório");
      }

      const { data: servico, error: servicoError } = await supabase
        .from("nfse_servicos")
        .select("*")
        .eq("codigo", formData.codigo_servico)
        .maybeSingle();

      if (servicoError) throw servicoError;

      const { data: nfseConfig, error: configError } = await supabase
        .from("nfse_config")
        .select("ambiente")
        .single();

      if (configError) throw configError;

      const nfseData = {
        ...formData,
        ambiente: nfseConfig.ambiente,
        status_sefaz: "pendente",
        aliquota_iss: servico?.aliquota_iss
      };

      const { data: nfse, error: nfseError } = await supabase
        .from("nfse")
        .insert(nfseData)
        .select()
        .single();

      if (nfseError) throw nfseError;

      toast({
        title: "NFS-e gerada com sucesso",
        description: `NFS-e número ${nfse.numero_nfse} foi gerada e está aguardando processamento.`,
      });

      setNfseToEdit(null);
      setShowEmissaoDialog(false);
      refreshData();
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
    if (!nfceCancelamento || !motivoCancelamento) return;

    try {
      const { error } = await supabase
        .from("nfse")
        .update({
          cancelada: true,
          motivo_cancelamento: motivoCancelamento,
          data_cancelamento: new Date().toISOString(),
          status_sefaz: "cancelada"
        })
        .eq("id", nfceCancelamento);

      if (error) throw error;

      await supabase.from("nfse_eventos").insert({
        nfse_id: nfceCancelamento,
        tipo_evento: "cancelamento",
        descricao: motivoCancelamento,
        status: "concluido"
      });

      toast({
        title: "NFS-e cancelada com sucesso",
      });

      setShowCancelDialog(false);
      setMotivoCancelamento("");
      setNfceCancelamento(null);
      refreshData();
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

  const handleCancelEnvio = async (nfseId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("nfse")
        .update({
          status_sefaz: "pendente"
        })
        .eq("id", nfseId);

      if (updateError) throw updateError;

      await supabase.from("nfse_eventos").insert({
        nfse_id: nfseId,
        tipo_evento: "cancelamento_envio",
        descricao: "Envio cancelado pelo usuário",
        status: "concluido"
      });

      toast({
        title: "Envio cancelado com sucesso",
      });

      refreshData();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar envio",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteNFSe = async () => {
    if (!nfseToDelete || !motivoExclusao) return;

    try {
      const { error } = await supabase
        .from("nfse")
        .update({
          excluida: true,
          data_exclusao: new Date().toISOString(),
          motivo_exclusao: motivoExclusao
        })
        .eq("id", nfseToDelete);

      if (error) throw error;

      await supabase.from("nfse_eventos").insert({
        nfse_id: nfseToDelete,
        tipo_evento: "exclusao",
        descricao: motivoExclusao,
        status: "concluido"
      });

      toast({
        title: "NFS-e excluída com sucesso",
      });

      setShowDeleteDialog(false);
      setMotivoExclusao("");
      setNfseToDelete(null);
      refreshData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir NFS-e",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadCSV = () => {
    if (!notas || notas.length === 0) {
      toast({
        title: "Nenhuma nota fiscal encontrada",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Tipo de Registro",
      "Data de Emissão",
      "Tipo de RPS",
      "Série do RPS",
      "Número do RPS",
      "Situação do RPS",
      "Número da NFS-e",
      "Data de Emissão da NFS-e",
      "Código de Verificação",
      "Inscrição Municipal do Prestador",
      "Indicador de CPF/CNPJ do Prestador",
      "CPF/CNPJ do Prestador",
      "Razão Social do Prestador",
      "Tipo do Endereço do Prestador",
      "Endereço do Prestador",
      "Número do Endereço do Prestador",
      "Complemento do Endereço do Prestador",
      "Bairro do Prestador",
      "Cidade do Prestador",
      "UF do Prestador",
      "CEP do Prestador",
      "Email do Prestador",
      "Regime Especial",
      "Opção Simples",
      "Código do Serviço Municipal",
      "Discriminação dos Serviços",
      "Valor dos Serviços",
      "Valor das Deduções",
      "Código do Município da Prestação",
      "Código da Tributação",
      "Indicador de CPF/CNPJ do Tomador",
      "CPF/CNPJ do Tomador",
      "Inscrição Municipal do Tomador",
      "Inscrição Estadual do Tomador",
      "Razão Social do Tomador",
      "Tipo do Endereço do Tomador",
      "Endereço do Tomador",
      "Número do Endereço do Tomador",
      "Complemento do Endereço do Tomador",
      "Bairro do Tomador",
      "Cidade do Tomador",
      "UF do Tomador",
      "CEP do Tomador",
      "Email do Tomador",
      "Situação da Nota Fiscal",
      "ISS Retido",
      "Valor do ISS",
      "Alíquota do ISS",
      "Base de Cálculo",
      "Valor do PIS",
      "Valor do COFINS",
      "Valor do INSS",
      "Valor do IR",
      "Valor do CSLL",
      "Fonte de Tributos",
      "Código do País do Prestador",
      "Código do País do Tomador"
    ];

    const csvData = notas
      .filter(nota => !nota.excluida)
      .map((nota) => [
        nota.tipo_registro || "2",
        format(new Date(nota.data_emissao), "dd/MM/yyyy"),
        nota.tipo_rps || "RPS",
        nota.serie_rps || "1",
        nota.numero_rps || "",
        nota.situacao_nota || "N",
        nota.numero_nfse || "",
        nota.data_hora_nfe ? format(new Date(nota.data_hora_nfe), "dd/MM/yyyy HH:mm:ss") : "",
        nota.codigo_verificacao || "",
        nota.inscricao_municipal_prestador || "",
        nota.tipo_documento_prestador || "2",
        nota.documento_prestador || "",
        nota.razao_social_prestador || "",
        nota.tipo_endereco_prestador || "R",
        nota.endereco_prestador || "",
        nota.numero_endereco_prestador || "",
        nota.complemento_endereco_prestador || "",
        nota.bairro_prestador || "",
        nota.cidade_prestador || "",
        nota.uf_prestador || "",
        nota.cep_prestador || "",
        nota.email_prestador || "",
        nota.regime_especial || "",
        nota.opcao_simples || "4",
        nota.codigo_servico_municipio || "",
        nota.discriminacao_servicos || "",
        formatMoney(nota.valor_servicos || 0).replace("R$", "").trim(),
        formatMoney(nota.valor_deducoes || 0).replace("R$", "").trim(),
        nota.municipio_prestacao_codigo || "",
        nota.codigo_tributacao_municipio || "",
        nota.tipo_documento_tomador || "2",
        nota.documento_tomador || "",
        nota.inscricao_municipal_tomador || "",
        nota.inscricao_estadual_tomador || "",
        nota.razao_social_tomador || "",
        nota.tipo_endereco_tomador || "R",
        nota.endereco_tomador || "",
        nota.numero_endereco_tomador || "",
        nota.complemento_endereco_tomador || "",
        nota.bairro_tomador || "",
        nota.cidade_tomador || "",
        nota.uf_tomador || "",
        nota.cep_tomador || "",
        nota.email_tomador || "",
        nota.situacao_nota || "N",
        nota.iss_retido || "N",
        formatMoney(nota.valor_iss || 0).replace("R$", "").trim(),
        nota.aliquota_iss ? `${nota.aliquota_iss}` : "0,00",
        formatMoney(nota.base_calculo || 0).replace("R$", "").trim(),
        formatMoney(nota.valor_pis || 0).replace("R$", "").trim(),
        formatMoney(nota.valor_cofins || 0).replace("R$", "").trim(),
        formatMoney(nota.valor_inss || 0).replace("R$", "").trim(),
        formatMoney(nota.valor_ir || 0).replace("R$", "").trim(),
        formatMoney(nota.valor_csll || 0).replace("R$", "").trim(),
        nota.fonte_tributos || "I",
        nota.codigo_pais_prestador || "1058",
        nota.codigo_pais_tomador || "1058"
      ]);

    // Adiciona linha de total
    const totalRow = [
      "Total",
      notas.length.toString(), // Quantidade de notas
      // Preenche o restante das colunas com valores vazios
      ...Array(headers.length - 2).fill("")
    ];

    // Adiciona BOM para Excel reconhecer caracteres especiais
    const BOM = "\uFEFF";
    const csvContent = BOM + [
      headers.join(";"),
      ...csvData.map(row => row.join(";")),
      totalRow.join(";")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `nfse_${format(new Date(), "dd-MM-yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setShowEmissaoDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova NFS-e
          </Button>
        </div>
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
              notas?.filter(nota => !nota.excluida).map((nota: NFSe) => (
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
                            onClick={() => handleSendToSefaz(nota.id)}
                            title="Enviar NFS-e"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setNfseToDelete(nota.id);
                              setShowDeleteDialog(true);
                            }}
                            title="Excluir NFS-e"
                          >
                            <Trash2 className="h-4 w-4" />
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

                      {nota.status_sefaz === "processado" && !nota.cancelada && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setNfceCancelamento(nota.id);
                              setShowCancelDialog(true);
                            }}
                            title="Cancelar NFS-e"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {nota.status_sefaz === "autorizada" && !nota.cancelada && (
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
                              setNfceCancelamento(nota.id);
                              setShowCancelDialog(true);
                            }}
                            title="Cancelar NFS-e"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
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
            onCancel={() => {
              setShowEmissaoDialog(false);
              setNfseToEdit(null);
            }}
            isLoading={isEmitindo}
            initialData={nfseToEdit}
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
                setNfceCancelamento(null);
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir NFS-e</DialogTitle>
            <DialogDescription>
              Informe o motivo da exclusão da nota fiscal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Exclusão</Label>
              <Textarea
                id="motivo"
                value={motivoExclusao}
                onChange={(e) => setMotivoExclusao(e.target.value)}
                placeholder="Descreva o motivo da exclusão..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setMotivoExclusao("");
                setNfseToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteNFSe}
              disabled={!motivoExclusao}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NFSeView
        nfseId={selectedNFSeId}
        onClose={() =>
