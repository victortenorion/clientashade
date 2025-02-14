
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { NFSeFormData } from "../types/nfse.types";

interface NFSeFormProps {
  onSubmit: (formData: NFSeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: NFSeFormData;
}

export const NFSeForm: React.FC<NFSeFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  initialData
}) => {
  const [formData, setFormData] = useState<NFSeFormData>({
    client_id: "",
    codigo_servico: "",
    discriminacao_servicos: "",
    valor_servicos: 0,
    data_competencia: format(new Date(), "yyyy-MM-dd"),
    deducoes: 0,
    observacoes: "",
    natureza_operacao: "",
    municipio_prestacao: "",
    cnae: "",
    retencao_ir: false,
    percentual_ir: 0,
    retencao_iss: false,
    desconto_iss: false,
    retencao_inss: false,
    retencao_pis_cofins_csll: false,
    percentual_tributos_ibpt: 0,
    desconto_incondicional: 0,
    vendedor_id: "",
    comissao_percentual: 0,
    numero_rps: "",
    serie_rps: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Dados do RPS</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Dados do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
              <Input
                id="natureza_operacao"
                value={formData.natureza_operacao}
                onChange={(e) => setFormData(prev => ({ ...prev, natureza_operacao: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="municipio_prestacao">Município de Prestação</Label>
                <Input
                  id="municipio_prestacao"
                  value={formData.municipio_prestacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, municipio_prestacao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnae">CNAE</Label>
                <Input
                  id="cnae"
                  value={formData.cnae}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnae: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_servico">Código do Serviço *</Label>
              <Input
                id="codigo_servico"
                value={formData.codigo_servico}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo_servico: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discriminacao_servicos">Descrição dos Serviços *</Label>
              <Textarea
                id="discriminacao_servicos"
                value={formData.discriminacao_servicos}
                onChange={(e) => setFormData(prev => ({ ...prev, discriminacao_servicos: e.target.value }))}
                placeholder="Detalhe os serviços prestados"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Valores e Impostos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_servicos">Valor Total dos Serviços *</Label>
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
              <Label htmlFor="desconto_incondicional">Desconto Incondicional</Label>
              <Input
                id="desconto_incondicional"
                type="number"
                step="0.01"
                value={formData.desconto_incondicional}
                onChange={(e) => setFormData(prev => ({ ...prev, desconto_incondicional: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentual_ir">Percentual IR (%)</Label>
              <Input
                id="percentual_ir"
                type="number"
                step="0.01"
                value={formData.percentual_ir}
                onChange={(e) => setFormData(prev => ({ ...prev, percentual_ir: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentual_tributos_ibpt">Percentual Tributos IBPT (%)</Label>
              <Input
                id="percentual_tributos_ibpt"
                type="number"
                step="0.01"
                value={formData.percentual_tributos_ibpt}
                onChange={(e) => setFormData(prev => ({ ...prev, percentual_tributos_ibpt: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="retencao_ir"
                checked={formData.retencao_ir}
                onChange={(e) => setFormData(prev => ({ ...prev, retencao_ir: e.target.checked }))}
              />
              <Label htmlFor="retencao_ir">Reter IR</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="retencao_iss"
                checked={formData.retencao_iss}
                onChange={(e) => setFormData(prev => ({ ...prev, retencao_iss: e.target.checked }))}
              />
              <Label htmlFor="retencao_iss">Reter ISS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="desconto_iss"
                checked={formData.desconto_iss}
                onChange={(e) => setFormData(prev => ({ ...prev, desconto_iss: e.target.checked }))}
              />
              <Label htmlFor="desconto_iss">Descontar ISS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="retencao_inss"
                checked={formData.retencao_inss}
                onChange={(e) => setFormData(prev => ({ ...prev, retencao_inss: e.target.checked }))}
              />
              <Label htmlFor="retencao_inss">Reter INSS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="retencao_pis_cofins_csll"
                checked={formData.retencao_pis_cofins_csll}
                onChange={(e) => setFormData(prev => ({ ...prev, retencao_pis_cofins_csll: e.target.checked }))}
              />
              <Label htmlFor="retencao_pis_cofins_csll">Reter CSLL, PIS e COFINS</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Dados do Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Emitindo..." : "Emitir NFS-e"}
        </Button>
      </div>
    </form>
  );
};
