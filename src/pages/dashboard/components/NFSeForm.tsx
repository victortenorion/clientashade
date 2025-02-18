
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { NFSeFormData } from "../types/nfse.types";

interface NFSeFormProps {
  onSubmit: (data: NFSeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: NFSeFormData | null;
}

export function NFSeForm({ onSubmit, onCancel, isLoading, initialData }: NFSeFormProps) {
  const [formData, setFormData] = useState<NFSeFormData>({
    codigo_servico: "",
    discriminacao_servicos: "",
    natureza_operacao: "1",
    tipo_recolhimento: "A",
    numero_rps: "",
    valor_servicos: 0,
    aliquota_servico: 0,
    iss_retido: false,
    base_calculo: 0,
    valor_iss: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Calcula o valor do ISS quando a alíquota ou base de cálculo mudam
  useEffect(() => {
    const novoValorIss = (formData.base_calculo * formData.aliquota_servico) / 100;
    setFormData(prev => ({ ...prev, valor_iss: novoValorIss }));
  }, [formData.base_calculo, formData.aliquota_servico]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo_servico">Código do Serviço</Label>
          <Input
            id="codigo_servico"
            value={formData.codigo_servico}
            onChange={(e) =>
              setFormData({ ...formData, codigo_servico: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discriminacao_servicos">Discriminação dos Serviços</Label>
          <Textarea
            id="discriminacao_servicos"
            value={formData.discriminacao_servicos}
            onChange={(e) =>
              setFormData({ ...formData, discriminacao_servicos: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
          <Select
            value={formData.natureza_operacao}
            onValueChange={(value) =>
              setFormData({ ...formData, natureza_operacao: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a natureza da operação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Tributação no município</SelectItem>
              <SelectItem value="2">Tributação fora do município</SelectItem>
              <SelectItem value="3">Isenção</SelectItem>
              <SelectItem value="4">Imune</SelectItem>
              <SelectItem value="5">Exigibilidade suspensa por decisão judicial</SelectItem>
              <SelectItem value="6">Exigibilidade suspensa por procedimento administrativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_recolhimento">Tipo de Recolhimento</Label>
          <Select
            value={formData.tipo_recolhimento}
            onValueChange={(value) =>
              setFormData({ ...formData, tipo_recolhimento: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de recolhimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A receber</SelectItem>
              <SelectItem value="R">Retido na fonte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_servicos">Valor dos Serviços</Label>
          <Input
            id="valor_servicos"
            type="number"
            step="0.01"
            value={formData.valor_servicos}
            onChange={(e) =>
              setFormData({ 
                ...formData, 
                valor_servicos: Number(e.target.value),
                base_calculo: Number(e.target.value) // Base de cálculo inicial igual ao valor dos serviços
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_calculo">Base de Cálculo</Label>
          <Input
            id="base_calculo"
            type="number"
            step="0.01"
            value={formData.base_calculo}
            onChange={(e) =>
              setFormData({ ...formData, base_calculo: Number(e.target.value) })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aliquota_servico">Alíquota do Serviço (%)</Label>
          <Input
            id="aliquota_servico"
            type="number"
            step="0.01"
            value={formData.aliquota_servico}
            onChange={(e) =>
              setFormData({ ...formData, aliquota_servico: Number(e.target.value) })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_iss">Valor do ISS</Label>
          <Input
            id="valor_iss"
            type="number"
            step="0.01"
            value={formData.valor_iss}
            readOnly
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="iss_retido"
            checked={formData.iss_retido}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, iss_retido: checked })
            }
          />
          <Label htmlFor="iss_retido">ISS Retido</Label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : initialData ? "Salvar alterações" : "Gerar NFS-e"}
        </Button>
      </div>
    </form>
  );
}
