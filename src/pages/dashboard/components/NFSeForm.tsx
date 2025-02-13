
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { NFSeFormData, NFSeServico } from "../types/nfse.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface Props {
  onSubmit: (data: NFSeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const NFSeForm = ({ onSubmit, onCancel, isLoading }: Props) => {
  const [formData, setFormData] = useState<NFSeFormData>({
    client_id: "",
    codigo_servico: "",
    discriminacao_servicos: "",
    valor_servicos: 0,
    data_competencia: format(new Date(), "yyyy-MM-dd"),
    deducoes: 0,
    observacoes: "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, document")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: servicos } = useQuery({
    queryKey: ["nfse_servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nfse_servicos")
        .select("*")
        .order("codigo");

      if (error) throw error;
      return data as NFSeServico[];
    },
  });

  const handleChange = (
    field: keyof NFSeFormData,
    value: string | number | Date
  ) => {
    if (field === "data_competencia" && value instanceof Date) {
      setFormData((prev) => ({
        ...prev,
        [field]: format(value, "yyyy-MM-dd"),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client_id">Cliente</Label>
        <Select
          value={formData.client_id}
          onValueChange={(value) => handleChange("client_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} - {client.document}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="codigo_servico">Serviço</Label>
        <Select
          value={formData.codigo_servico}
          onValueChange={(value) => handleChange("codigo_servico", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o serviço" />
          </SelectTrigger>
          <SelectContent>
            {servicos?.map((servico) => (
              <SelectItem key={servico.id} value={servico.codigo}>
                {servico.codigo} - {servico.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discriminacao_servicos">Discriminação dos Serviços</Label>
        <Textarea
          id="discriminacao_servicos"
          value={formData.discriminacao_servicos}
          onChange={(e) =>
            handleChange("discriminacao_servicos", e.target.value)
          }
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor_servicos">Valor dos Serviços</Label>
          <Input
            id="valor_servicos"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor_servicos}
            onChange={(e) =>
              handleChange("valor_servicos", parseFloat(e.target.value))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deducoes">Deduções</Label>
          <Input
            id="deducoes"
            type="number"
            step="0.01"
            min="0"
            value={formData.deducoes}
            onChange={(e) =>
              handleChange("deducoes", parseFloat(e.target.value))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data de Competência</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.data_competencia && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.data_competencia ? (
                format(new Date(formData.data_competencia), "dd/MM/yyyy")
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(formData.data_competencia)}
              onSelect={(date) =>
                handleChange("data_competencia", date || new Date())
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleChange("observacoes", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
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
