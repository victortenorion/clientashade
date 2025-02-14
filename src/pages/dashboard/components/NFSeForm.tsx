import React, { useState } from "react";
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

interface NFSeFormData {
  serviceCode: string;
  cnae: string;
  date: Date;
  description: string;
  amount: number;
}

interface NFSeFormProps {
  onSubmit: (formData: NFSeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const NFSeForm: React.FC<NFSeFormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<NFSeFormData>({
    serviceCode: "",
    cnae: "",
    date: new Date(),
    description: "",
    amount: 0
  });

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
              <Label htmlFor="serviceCode">Código de Serviço</Label>
              <Input
                id="serviceCode"
                value={formData.serviceCode}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceCode: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE</Label>
              <Input
                id="cnae"
                value={formData.cnae}
                onChange={(e) => setFormData(prev => ({ ...prev, cnae: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data de Emissão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição dos Serviços</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhe os serviços prestados"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Total dos Serviços</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                placeholder="Informe o valor total"
                required
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
