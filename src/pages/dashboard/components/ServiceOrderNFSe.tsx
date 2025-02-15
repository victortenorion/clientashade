import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { NFSeFormData } from "../types/nfse.types";

interface ServiceOrderNFSeProps {
  serviceOrderId: string;
  onSubmit: (data: NFSeFormData) => void;
  onCancel: () => void;
}

export const ServiceOrderNFSe: React.FC<ServiceOrderNFSeProps> = ({
  serviceOrderId,
  onSubmit,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<NFSeFormData>({
    client_id: "",
    tipo_registro: "2",
    numero_rps: "",
    tipo_rps: "RPS",
    serie_rps: "1",
    data_competencia: new Date().toISOString().split("T")[0],
    codigo_servico: "",
    discriminacao_servicos: "",
    valor_servicos: 0,
    valor_deducoes: 0,
    deducoes: 0,
    aliquota_iss: 0,
    aliquota_pis: 0,
    aliquota_cofins: 0,
    aliquota_csll: 0,
    valor_iss: 0,
    tipo_documento_prestador: "2",
    inscricao_prestador: "",
    documento_prestador: "",
    razao_social_prestador: "",
    tipo_endereco_prestador: "R",
    endereco_prestador: "",
    numero_endereco_prestador: "",
    complemento_endereco_prestador: "",
    bairro_prestador: "",
    cidade_prestador: "",
    uf_prestador: "",
    cep_prestador: "",
    email_prestador: "",
    opcao_simples: "4",
    tipo_documento_tomador: "2",
    documento_tomador: "",
    inscricao_municipal_tomador: "",
    inscricao_estadual_tomador: "",
    razao_social_tomador: "",
    tipo_endereco_tomador: "",
    endereco_tomador: "",
    numero_endereco_tomador: "",
    complemento_endereco_tomador: "",
    bairro_tomador: "",
    cidade_tomador: "",
    uf_tomador: "",
    cep_tomador: "",
    email_tomador: "",
    tipo_documento_intermediario: "",
    documento_intermediario: "",
    inscricao_municipal_intermediario: "",
    razao_social_intermediario: "",
    repasse_plano_saude: 0,
    valor_pis: 0,
    valor_cofins: 0,
    valor_inss: 0,
    valor_ir: 0,
    valor_csll: 0,
    outras_retencoes: 0,
    valor_carga_tributaria: 0,
    percentual_carga_tributaria: 0,
    fonte_carga_tributaria: "",
    cei: "",
    matricula_obra: "",
    municipio_prestacao: "",
    municipio_prestacao_codigo: "",
    situacao_aceite: "",
    encapsulamento: "",
    valor_total_recebido: 0,
    tipo_consolidacao: "",
    nfse_consolidada: "",
    natureza_operacao: "1",
    retencao_ir: false,
    percentual_ir: 0,
    retencao_iss: false,
    desconto_iss: false,
    retencao_inss: false,
    retencao_pis_cofins_csll: false,
    desconto_incondicional: 0,
    vendedor_id: "",
    comissao_percentual: 0,
    responsavel_retencao: "tomador",
    local_servico: "tomador",
    optante_mei: false,
    prestador_incentivador_cultural: false,
    tributacao_rps: "T",
    enviar_email_tomador: true,
    enviar_email_intermediario: false,
    intermediario_servico: false,
    codigo_regime_especial_tributacao: null,
    observacoes: "",
    cnae: "",
    valor_total: 0,
    percentual_tributos_ibpt: 0
  });

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerar NFSe para Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados da NFSe para a ordem de serviço selecionada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientId" className="text-right">
              Cliente
            </Label>
            <Input
              id="clientId"
              className="col-span-3"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="codigoServico" className="text-right">
              Código de Serviço
            </Label>
            <Input
              id="codigoServico"
              className="col-span-3"
              value={formData.codigo_servico}
              onChange={(e) => setFormData({ ...formData, codigo_servico: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discriminacaoServicos" className="text-right">
              Discriminação dos Serviços
            </Label>
            <Textarea
              id="discriminacaoServicos"
              className="col-span-3"
              value={formData.discriminacao_servicos}
              onChange={(e) => setFormData({ ...formData, discriminacao_servicos: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="valorServicos" className="text-right">
              Valor dos Serviços
            </Label>
            <Input
              type="number"
              id="valorServicos"
              className="col-span-3"
              value={formData.valor_servicos.toString()}
              onChange={(e) => setFormData({ ...formData, valor_servicos: parseFloat(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataCompetencia" className="text-right">
              Data de Competência
            </Label>
            <Input
              type="date"
              id="dataCompetencia"
              className="col-span-3"
              value={formData.data_competencia}
              onChange={(e) => setFormData({ ...formData, data_competencia: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deducoes" className="text-right">
              Deduções
            </Label>
            <Input
              type="number"
              id="deducoes"
              className="col-span-3"
              value={formData.deducoes.toString()}
              onChange={(e) => setFormData({ ...formData, deducoes: parseFloat(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observacoes" className="text-right">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              className="col-span-3"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="naturezaOperacao" className="text-right">
              Natureza da Operação
            </Label>
            <Input
              id="naturezaOperacao"
              className="col-span-3"
              value={formData.natureza_operacao}
              onChange={(e) => setFormData({ ...formData, natureza_operacao: e.target.value })}
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="municipioPrestacao" className="text-right">
              Município de Prestação
            </Label>
            <Input
              id="municipioPrestacao"
              className="col-span-3"
              value={formData.municipio_prestacao}
              onChange={(e) => setFormData({ ...formData, municipio_prestacao: e.target.value })}
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="codigoRegimeEspecialTributacao" className="text-right">
              Código de Regime Especial de Tributação
            </Label>
            <Input
              id="codigoRegimeEspecialTributacao"
              className="col-span-3"
              value={formData.codigo_regime_especial_tributacao || ""}
              onChange={(e) => setFormData({ ...formData, codigo_regime_especial_tributacao: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onCancel()}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(formData)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
