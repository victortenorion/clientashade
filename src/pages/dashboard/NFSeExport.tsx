
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { NFSe } from "./types/nfse.types";

const NFSeExport = () => {
  const { toast } = useToast();

  const { data: notas, isLoading } = useQuery({
    queryKey: ["nfse"],
    queryFn: async () => {
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
        .order("data_emissao", { ascending: false });

      if (error) throw error;
      return data as NFSe[];
    }
  });

  const formatMoney = (value: number | null) => {
    if (value === null) return "0,00";
    return value.toString().replace(".", ",");
  };

  const handleExportCSV = () => {
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
      "Nº NFS-e",
      "Data Hora NFE",
      "Código de Verificação da NFS-e",
      "Tipo de RPS",
      "Série do RPS",
      "Número do RPS",
      "Data do Fato Gerador",
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
      "Opção Pelo Simples",
      "Situação da Nota Fiscal",
      "Data de Cancelamento",
      "Nº da Guia",
      "Data de Quitação da Guia Vinculada a Nota Fiscal",
      "Valor dos Serviços",
      "Valor das Deduções",
      "Código do Serviço Prestado na Nota Fiscal",
      "Alíquota",
      "ISS devido",
      "Valor do Crédito",
      "ISS Retido",
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
      "Nº NFS-e Substituta",
      "ISS pago",
      "ISS a pagar",
      "Indicador de CPF/CNPJ do Intermediário",
      "CPF/CNPJ do Intermediário",
      "Inscrição Municipal do Intermediário",
      "Razão Social do Intermediário",
      "Repasse do Plano de Saúde",
      "PIS/PASEP",
      "COFINS",
      "INSS",
      "IR",
      "CSLL",
      "Carga tributária: Valor",
      "Carga tributária: Porcentagem",
      "Carga tributária: Fonte",
      "CEI",
      "Matrícula da Obra",
      "Município Prestação - cód. IBGE",
      "Situação do Aceite",
      "Encapsulamento",
      "Valor Total Recebido",
      "Tipo de Consolidação",
      "Nº NFS-e Consolidada",
      "Campo Reservado",
      "Discriminação dos Serviços"
    ];

    const csvData = notas
      .filter(nota => !nota.excluida)
      .map((nota) => [
        nota.tipo_registro || "2",
        nota.numero_nfse,
        format(new Date(nota.data_hora_nfe || nota.data_emissao), "dd/MM/yyyy HH:mm:ss"),
        nota.codigo_verificacao || "",
        nota.tipo_rps || "RPS",
        nota.serie_rps || "",
        nota.numero_rps || "",
        format(new Date(nota.data_fato_gerador || nota.data_emissao), "dd/MM/yyyy"),
        nota.inscricao_prestador || "",
        nota.tipo_documento_prestador || "",
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
        nota.opcao_simples || "",
        nota.situacao_nota || "T",
        nota.data_cancelamento ? format(new Date(nota.data_cancelamento), "dd/MM/yyyy") : "",
        nota.numero_guia || "",
        nota.data_quitacao_guia ? format(new Date(nota.data_quitacao_guia), "dd/MM/yyyy") : "",
        formatMoney(nota.valor_servicos),
        formatMoney(nota.valor_deducoes || 0),
        nota.codigo_servico || "",
        formatMoney(nota.aliquota_iss || 0),
        formatMoney(nota.valor_iss || 0),
        formatMoney(nota.valor_credito || 0),
        nota.iss_retido || "N",
        nota.tipo_documento_tomador || "",
        nota.documento_tomador || "",
        nota.inscricao_municipal_tomador || "",
        nota.inscricao_estadual_tomador || "",
        nota.razao_social_tomador || "",
        nota.tipo_endereco_tomador || "",
        nota.endereco_tomador || "",
        nota.numero_endereco_tomador || "",
        nota.complemento_endereco_tomador || "",
        nota.bairro_tomador || "",
        nota.cidade_tomador || "",
        nota.uf_tomador || "",
        nota.cep_tomador || "",
        nota.email_tomador || "",
        nota.nfse_substituta || "",
        formatMoney(nota.iss_pago || 0),
        formatMoney(nota.iss_a_pagar || 0),
        nota.tipo_documento_intermediario || "",
        nota.documento_intermediario || "",
        nota.inscricao_municipal_intermediario || "",
        nota.razao_social_intermediario || "",
        formatMoney(nota.repasse_plano_saude || 0),
        formatMoney(nota.valor_pis || 0),
        formatMoney(nota.valor_cofins || 0),
        formatMoney(nota.valor_inss || 0),
        formatMoney(nota.valor_ir || 0),
        formatMoney(nota.valor_csll || 0),
        formatMoney(nota.valor_carga_tributaria || 0),
        nota.percentual_carga_tributaria ? formatMoney(nota.percentual_carga_tributaria) : "0,00",
        nota.fonte_carga_tributaria || "",
        nota.cei || "",
        nota.matricula_obra || "",
        nota.municipio_prestacao || "",
        nota.situacao_aceite || "",
        nota.encapsulamento || "",
        formatMoney(nota.valor_total_recebido || 0),
        nota.tipo_consolidacao || "",
        nota.nfse_consolidada || "",
        "",
        nota.discriminacao_servicos?.replace(/"/g, '""') || ""
      ]);

    // Adiciona linha de total
    const totalRow = [
      "Total",
      notas.length.toString(),
      "",
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
      formatMoney(notas.reduce((acc, nota) => acc + (nota.valor_servicos || 0), 0)),
      formatMoney(notas.reduce((acc, nota) => acc + (nota.valor_deducoes || 0), 0)),
      "",
      formatMoney(notas.reduce((acc, nota) => acc + (nota.valor_iss || 0), 0)),
      "0,00",
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
    ];

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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exportar NFS-e</h1>
        <Button
          onClick={handleExportCSV}
          disabled={isLoading || !notas?.length}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
};

export default NFSeExport;
