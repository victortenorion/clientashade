
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
    observacoes: ""
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
          <CardTitle>Emitir NFS-e</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_servico">Código de Serviço</Label>
              <Input
                id="codigo_servico"
                value={formData.codigo_servico}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo_servico: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discriminacao_servicos">Descrição dos Serviços</Label>
              <Textarea
                id="discriminacao_servicos"
                value={formData.discriminacao_servicos}
                onChange={(e) => setFormData(prev => ({ ...prev, discriminacao_servicos: e.target.value }))}
                placeholder="Detalhe os serviços prestados"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_servicos">Valor Total dos Serviços</Label>
              <Input
                id="valor_servicos"
                type="number"
                value={formData.valor_servicos}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_servicos: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Competência</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !formData.data_competencia && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_competencia ? format(new Date(formData.data_competencia), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(formData.data_competencia)}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, data_competencia: format(date, "yyyy-MM-dd") }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais"
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
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
