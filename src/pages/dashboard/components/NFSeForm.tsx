
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { NFSeFormData } from "../types/nfse.types";

interface NFSeFormProps {
  onSubmit: (formData: NFSeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
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
  const [formData, setFormData] = useState<NFSeFormData>(initialData || {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="servico" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="servico">Serviço</TabsTrigger>
          <TabsTrigger value="prestador">Prestador</TabsTrigger>
          <TabsTrigger value="tomador">Tomador</TabsTrigger>
          <TabsTrigger value="impostos">Impostos</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        <TabsContent value="servico">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_rps">Número RPS</Label>
                  <Input
                    id="numero_rps"
                    value={formData.numero_rps}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_rps: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serie_rps">Série RPS</Label>
                  <Input
                    id="serie_rps"
                    value={formData.serie_rps}
                    onChange={(e) => setFormData(prev => ({ ...prev, serie_rps: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_servico">Código do Serviço</Label>
                <Input
                  id="codigo_servico"
                  value={formData.codigo_servico}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo_servico: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discriminacao_servicos">Discriminação dos Serviços</Label>
                <Textarea
                  id="discriminacao_servicos"
                  value={formData.discriminacao_servicos}
                  onChange={(e) => setFormData(prev => ({ ...prev, discriminacao_servicos: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_servicos">Valor dos Serviços</Label>
                  <Input
                    id="valor_servicos"
                    type="number"
                    step="0.01"
                    value={formData.valor_servicos}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_servicos: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_deducoes">Valor das Deduções</Label>
                  <Input
                    id="valor_deducoes"
                    type="number"
                    step="0.01"
                    value={formData.valor_deducoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_deducoes: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prestador">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Prestador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documento_prestador">CNPJ/CPF do Prestador</Label>
                  <Input
                    id="documento_prestador"
                    value={formData.documento_prestador}
                    onChange={(e) => setFormData(prev => ({ ...prev, documento_prestador: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricao_prestador">Inscrição Municipal</Label>
                  <Input
                    id="inscricao_prestador"
                    value={formData.inscricao_prestador}
                    onChange={(e) => setFormData(prev => ({ ...prev, inscricao_prestador: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="razao_social_prestador">Razão Social</Label>
                <Input
                  id="razao_social_prestador"
                  value={formData.razao_social_prestador}
                  onChange={(e) => setFormData(prev => ({ ...prev, razao_social_prestador: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco_prestador">Endereço</Label>
                  <Input
                    id="endereco_prestador"
                    value={formData.endereco_prestador}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_prestador: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_endereco_prestador">Número</Label>
                  <Input
                    id="numero_endereco_prestador"
                    value={formData.numero_endereco_prestador}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_endereco_prestador: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro_prestador">Bairro</Label>
                  <Input
                    id="bairro_prestador"
                    value={formData.bairro_prestador}
                    onChange={(e) => setFormData(prev => ({ ...prev, bairro_prestador: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade_prestador">Cidade</Label>
                  <Input
                    id="cidade_prestador"
                    value={formData.cidade_prestador}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade_prestador: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uf_prestador">UF</Label>
                  <Input
                    id="uf_prestador"
                    value={formData.uf_prestador}
                    onChange={(e) => setFormData(prev => ({ ...prev, uf_prestador: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep_prestador">CEP</Label>
                  <Input
                    id="cep_prestador"
                    value={formData.cep_prestador}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep_prestador: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tomador">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Tomador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documento_tomador">CNPJ/CPF do Tomador</Label>
                  <Input
                    id="documento_tomador"
                    value={formData.documento_tomador}
                    onChange={(e) => setFormData(prev => ({ ...prev, documento_tomador: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricao_municipal_tomador">Inscrição Municipal</Label>
                  <Input
                    id="inscricao_municipal_tomador"
                    value={formData.inscricao_municipal_tomador}
                    onChange={(e) => setFormData(prev => ({ ...prev, inscricao_municipal_tomador: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="razao_social_tomador">Razão Social</Label>
                <Input
                  id="razao_social_tomador"
                  value={formData.razao_social_tomador}
                  onChange={(e) => setFormData(prev => ({ ...prev, razao_social_tomador: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco_tomador">Endereço</Label>
                  <Input
                    id="endereco_tomador"
                    value={formData.endereco_tomador}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_tomador: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_endereco_tomador">Número</Label>
                  <Input
                    id="numero_endereco_tomador"
                    value={formData.numero_endereco_tomador}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_endereco_tomador: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro_tomador">Bairro</Label>
                  <Input
                    id="bairro_tomador"
                    value={formData.bairro_tomador}
                    onChange={(e) => setFormData(prev => ({ ...prev, bairro_tomador: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade_tomador">Cidade</Label>
                  <Input
                    id="cidade_tomador"
                    value={formData.cidade_tomador}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade_tomador: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uf_tomador">UF</Label>
                  <Input
                    id="uf_tomador"
                    value={formData.uf_tomador}
                    onChange={(e) => setFormData(prev => ({ ...prev, uf_tomador: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep_tomador">CEP</Label>
                  <Input
                    id="cep_tomador"
                    value={formData.cep_tomador}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep_tomador: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impostos">
          <Card>
            <CardHeader>
              <CardTitle>Impostos e Retenções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aliquota_iss">Alíquota ISS (%)</Label>
                  <Input
                    id="aliquota_iss"
                    type="number"
                    step="0.01"
                    value={formData.aliquota_iss}
                    onChange={(e) => setFormData(prev => ({ ...prev, aliquota_iss: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_iss">Valor ISS</Label>
                  <Input
                    id="valor_iss"
                    type="number"
                    step="0.01"
                    value={formData.valor_iss}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_iss: parseFloat(e.target.value) || 0 }))}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Switch
                      checked={formData.retencao_ir}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, retencao_ir: checked }))}
                    />
                    Retenção IR
                  </Label>
                  {formData.retencao_ir && (
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.percentual_ir}
                      onChange={(e) => setFormData(prev => ({ ...prev, percentual_ir: parseFloat(e.target.value) || 0 }))}
                      placeholder="Percentual IR (%)"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Switch
                      checked={formData.retencao_iss}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, retencao_iss: checked }))}
                    />
                    Retenção ISS
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Switch
                      checked={formData.retencao_pis_cofins_csll}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, retencao_pis_cofins_csll: checked }))}
                    />
                    Retenção PIS/COFINS/CSLL
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Switch
                      checked={formData.retencao_inss}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, retencao_inss: checked }))}
                    />
                    Retenção INSS
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aliquota_pis">Alíquota PIS (%)</Label>
                  <Input
                    id="aliquota_pis"
                    type="number"
                    step="0.01"
                    value={formData.aliquota_pis}
                    onChange={(e) => setFormData(prev => ({ ...prev, aliquota_pis: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota_cofins">Alíquota COFINS (%)</Label>
                  <Input
                    id="aliquota_cofins"
                    type="number"
                    step="0.01"
                    value={formData.aliquota_cofins}
                    onChange={(e) => setFormData(prev => ({ ...prev, aliquota_cofins: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota_csll">Alíquota CSLL (%)</Label>
                  <Input
                    id="aliquota_csll"
                    type="number"
                    step="0.01"
                    value={formData.aliquota_csll}
                    onChange={(e) => setFormData(prev => ({ ...prev, aliquota_csll: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outros">
          <Card>
            <CardHeader>
              <CardTitle>Outras Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
                <Select
                  value={formData.natureza_operacao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, natureza_operacao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a natureza da operação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Tributação no município</SelectItem>
                    <SelectItem value="2">2 - Tributação fora do município</SelectItem>
                    <SelectItem value="3">3 - Isenção</SelectItem>
                    <SelectItem value="4">4 - Imune</SelectItem>
                    <SelectItem value="5">5 - Exigibilidade suspensa por decisão judicial</SelectItem>
                    <SelectItem value="6">6 - Exigibilidade suspensa por procedimento administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendedor_id">Vendedor</Label>
                  <Input
                    id="vendedor_id"
                    value={formData.vendedor_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendedor_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comissao_percentual">Comissão (%)</Label>
                  <Input
                    id="comissao_percentual"
                    type="number"
                    step="0.01"
                    value={formData.comissao_percentual}
                    onChange={(e) => setFormData(prev => ({ ...prev, comissao_percentual: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : submitButtonText}
        </Button>
      </div>
    </form>
  );
};
