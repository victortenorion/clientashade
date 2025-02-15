import React, { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { NFSeFormData } from "../types/nfse.types";

const formSchema = z.object({
  client_id: z.string().min(1, {
    message: "Client ID is required.",
  }),
  tipo_registro: z.string().optional(),
  tipo_rps: z.string().optional(),
  serie_rps: z.string().optional(),
  numero_rps: z.string().optional(),
  data_emissao: z.string().optional(),
  data_competencia: z.string().optional(),
  data_fato_gerador: z.string().optional(),
  inscricao_prestador: z.string().optional(),
  tipo_documento_prestador: z.string().optional(),
  documento_prestador: z.string().optional(),
  razao_social_prestador: z.string().optional(),
  tipo_endereco_prestador: z.string().optional(),
  endereco_prestador: z.string().optional(),
  numero_endereco_prestador: z.string().optional(),
  complemento_endereco_prestador: z.string().optional(),
  bairro_prestador: z.string().optional(),
  cidade_prestador: z.string().optional(),
  uf_prestador: z.string().optional(),
  cep_prestador: z.string().optional(),
  email_prestador: z.string().optional(),
  codigo_servico: z.string().optional(),
  discriminacao_servicos: z.string().optional(),
  valor_servicos: z.number().optional(),
  valor_deducoes: z.number().optional(),
  deducoes: z.number().optional(),
  aliquota_iss: z.number().optional(),
  valor_iss: z.number().optional(),
  iss_retido: z.string().optional(),
  tipo_documento_tomador: z.string().optional(),
  documento_tomador: z.string().optional(),
  razao_social_tomador: z.string().optional(),
  inscricao_municipal_tomador: z.string().optional(),
  inscricao_estadual_tomador: z.string().optional(),
  tipo_endereco_tomador: z.string().optional(),
  endereco_tomador: z.string().optional(),
  numero_endereco_tomador: z.string().optional(),
  complemento_endereco_tomador: z.string().optional(),
  bairro_tomador: z.string().optional(),
  cidade_tomador: z.string().optional(),
  uf_tomador: z.string().optional(),
  cep_tomador: z.string().optional(),
  email_tomador: z.string().optional(),
  valor_pis: z.number().optional(),
  valor_cofins: z.number().optional(),
  valor_inss: z.number().optional(),
  valor_ir: z.number().optional(),
  valor_csll: z.number().optional(),
  outras_retencoes: z.number().optional(),
  valor_carga_tributaria: z.number().optional(),
  percentual_carga_tributaria: z.number().optional(),
  percentual_tributos_ibpt: z.number().optional(),
  valor_total: z.number().optional(),
  status_transmissao: z.string().optional(),
  status_sefaz: z.string().optional(),
  situacao_nota: z.string().optional(),
  opcao_simples: z.string().optional(),
  natureza_operacao: z.string().optional(),
  retencao_ir: z.boolean().optional(),
  percentual_ir: z.number().optional(),
  retencao_iss: z.boolean().optional(),
  desconto_iss: z.boolean().optional(),
  retencao_inss: z.boolean().optional(),
  retencao_pis_cofins_csll: z.boolean().optional(),
  desconto_incondicional: z.number().optional(),
  comissao_percentual: z.number().optional(),
  responsavel_retencao: z.string().optional(),
  local_servico: z.string().optional(),
  aliquota_pis: z.number().optional(),
  aliquota_cofins: z.number().optional(),
  aliquota_csll: z.number().optional(),
  observacoes: z.string().optional(),
  municipio_prestacao: z.string().optional(),
  cnae: z.string().optional(),
  vendedor_id: z.string().optional(),
  tributacao_rps: z.string().optional(),
  enviar_email_tomador: z.boolean().optional(),
  enviar_email_intermediario: z.boolean().optional(),
  intermediario_servico: z.boolean().optional(),
  codigo_regime_especial_tributacao: z.string().optional(),
  tipo_regime_especial: z.string().optional(),
  unidade_codigo: z.string().optional(),
  codigo_proprio: z.string().optional(),
  inscricao_estadual_prestador: z.string().optional(),
  codigo_pais_prestador: z.string().optional(),
  codigo_pais_tomador: z.string().optional(),
  tipo_servico: z.string().optional()
});

interface NFSeFormProps {
  onSubmit: (data: NFSeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: NFSeFormData;
  submitButtonText?: string;
}

export const NFSeForm: React.FC<NFSeFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  initialData,
  submitButtonText = "Salvar"
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<NFSeFormData>({
    ...initialData,
    tipo_servico: initialData?.tipo_servico || "P",
    responsavel_retencao: initialData?.responsavel_retencao || "T",
    situacao_nota: initialData?.situacao_nota || "N"
  });

  const form = useForm<NFSeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...formData,
      valor_servicos: formData.valor_servicos || 0,
      valor_deducoes: formData.valor_deducoes || 0,
      deducoes: formData.deducoes || 0,
      aliquota_iss: formData.aliquota_iss || 0,
      valor_iss: formData.valor_iss || 0,
      valor_pis: formData.valor_pis || 0,
      valor_cofins: formData.valor_cofins || 0,
      valor_inss: formData.valor_inss || 0,
      valor_ir: formData.valor_ir || 0,
      valor_csll: formData.valor_csll || 0,
      outras_retencoes: formData.outras_retencoes || 0,
      valor_carga_tributaria: formData.valor_carga_tributaria || 0,
      percentual_carga_tributaria: formData.percentual_carga_tributaria || 0,
      percentual_tributos_ibpt: formData.percentual_tributos_ibpt || 0,
      valor_total: formData.valor_total || 0,
      desconto_incondicional: formData.desconto_incondicional || 0,
      comissao_percentual: formData.comissao_percentual || 0,
      aliquota_pis: formData.aliquota_pis || 0,
      aliquota_cofins: formData.aliquota_cofins || 0,
      aliquota_csll: formData.aliquota_csll || 0,
      retencao_ir: formData.retencao_ir || false,
      retencao_iss: formData.retencao_iss || false,
      desconto_iss: formData.desconto_iss || false,
      retencao_inss: formData.retencao_inss || false,
      retencao_pis_cofins_csll: formData.retencao_pis_cofins_csll || false,
      enviar_email_tomador: formData.enviar_email_tomador ?? true,
      enviar_email_intermediario: formData.enviar_email_intermediario ?? false,
      intermediario_servico: formData.intermediario_servico ?? false
    },
    mode: "onChange",
  });

  function onSubmitHandler(values: NFSeFormData) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-4">
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client ID</FormLabel>
              <FormControl>
                <Input placeholder="Client ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_registro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Registro</FormLabel>
              <FormControl>
                <Input placeholder="Tipo Registro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_rps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo RPS</FormLabel>
              <FormControl>
                <Input placeholder="Tipo RPS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serie_rps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serie RPS</FormLabel>
              <FormControl>
                <Input placeholder="Serie RPS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numero_rps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número RPS</FormLabel>
              <FormControl>
                <Input placeholder="Número RPS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_emissao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Emissão</FormLabel>
              <FormControl>
                <Input type="date" placeholder="Data Emissão" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_competencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Competência</FormLabel>
              <FormControl>
                <Input type="date" placeholder="Data Competência" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_fato_gerador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Fato Gerador</FormLabel>
              <FormControl>
                <Input type="date" placeholder="Data Fato Gerador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inscricao_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inscrição Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Inscrição Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_documento_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Documento Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Tipo Documento Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documento_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documento Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Documento Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="razao_social_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razão Social Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Razão Social Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_endereco_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Endereço Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Tipo Endereço Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endereco_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Endereço Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numero_endereco_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número Endereço Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Número Endereço Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="complemento_endereco_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento Endereço Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Complemento Endereço Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bairro_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Bairro Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cidade_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade Prestador</FormLabel>
              <FormControl>
                <Input placeholder="Cidade Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uf_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UF Prestador</FormLabel>
              <FormControl>
                <Input placeholder="UF Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cep_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP Prestador</FormLabel>
              <FormControl>
                <Input placeholder="CEP Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email_prestador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Prestador</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email Prestador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="codigo_servico"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código Serviço</FormLabel>
              <FormControl>
                <Input placeholder="Código Serviço" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discriminacao_servicos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discriminação Serviços</FormLabel>
              <FormControl>
                <Textarea placeholder="Discriminação Serviços" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_servicos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Serviços</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor Serviços" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_deducoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Deduções</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor Deduções" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deducoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deduções</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Deduções" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aliquota_iss"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aliquota ISS</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Aliquota ISS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_iss"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor ISS</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor ISS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="iss_retido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ISS Retido</FormLabel>
              <FormControl>
                <Input placeholder="ISS Retido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_documento_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Documento Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Tipo Documento Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documento_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documento Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Documento Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="razao_social_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razão Social Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Razão Social Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inscricao_municipal_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inscrição Municipal Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Inscrição Municipal Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inscricao_estadual_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inscrição Estadual Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Inscrição Estadual Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_endereco_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Endereço Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Tipo Endereço Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endereco_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Endereço Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numero_endereco_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número Endereço Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Número Endereço Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="complemento_endereco_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento Endereço Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Complemento Endereço Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bairro_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Bairro Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cidade_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade Tomador</FormLabel>
              <FormControl>
                <Input placeholder="Cidade Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uf_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UF Tomador</FormLabel>
              <FormControl>
                <Input placeholder="UF Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cep_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP Tomador</FormLabel>
              <FormControl>
                <Input placeholder="CEP Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email_tomador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Tomador</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email Tomador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_pis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor PIS</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor PIS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_cofins"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor COFINS</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor COFINS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_inss"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor INSS</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor INSS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_ir"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor IR</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor IR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_csll"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor CSLL</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor CSLL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="outras_retencoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outras Retenções</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Outras Retenções" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_carga_tributaria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Carga Tributária</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor Carga Tributária" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="percentual_carga_tributaria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percentual Carga Tributária</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Percentual Carga Tributária" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="percentual_tributos_ibpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percentual Tributos IBPT</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Percentual Tributos IBPT" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_total"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Valor Total" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status_transmissao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Transmissão</FormLabel>
              <FormControl>
                <Input placeholder="Status Transmissão" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status_sefaz"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Sefaz</FormLabel>
              <FormControl>
                <Input placeholder="Status Sefaz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="situacao_nota"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Situação Nota</FormLabel>
              <FormControl>
                <Input placeholder="Situação Nota" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="opcao_simples"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opção Simples</FormLabel>
              <FormControl>
                <Input placeholder="Opção Simples" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="natureza_operacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Natureza Operação</FormLabel>
              <FormControl>
                <Input placeholder="Natureza Operação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="retencao_ir"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Retenção IR</FormLabel>
                <FormDescription>
                  Indica se há retenção de Imposto de Renda.
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="percentual_ir"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percentual IR</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Percentual IR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="retencao_iss"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Retenção ISS</FormLabel>
                <FormDescription>
                  Indica se há retenção de ISS
