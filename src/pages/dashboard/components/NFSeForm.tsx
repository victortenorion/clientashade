
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
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
