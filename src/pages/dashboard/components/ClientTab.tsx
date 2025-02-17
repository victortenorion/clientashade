
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface CustomerAreaField {
  id: string;
  field_name: string;
  visible: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  order_number: "Número da Ordem",
  created_at: "Data de Criação",
  status: "Status",
  priority: "Prioridade",
  equipment: "Equipamento",
  equipment_serial_number: "Número de Série",
  problem: "Problema",
  description: "Descrição",
  expected_date: "Data Prevista",
  completion_date: "Data de Conclusão",
  exit_date: "Data de Saída",
  total_price: "Valor Total"
};

export const ClientTab = () => {
  const { toast } = useToast();
  const [fields, setFields] = useState<CustomerAreaField[]>([]);

  const loadFields = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_area_field_settings')
        .select('*')
        .order('field_name');

      if (error) throw error;

      setFields(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar campos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações dos campos.",
        variant: "destructive"
      });
    }
  };

  const handleFieldVisibilityChange = async (id: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from('customer_area_field_settings')
        .update({ visible })
        .eq('id', id);

      if (error) throw error;

      setFields(fields.map(field => 
        field.id === id ? { ...field, visible } : field
      ));

      toast({
        title: "Sucesso",
        description: "Visibilidade do campo atualizada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar visibilidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a visibilidade do campo.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="text-lg font-semibold mb-4">
              Campos Visíveis na Página do Cliente
            </div>
            <div className="grid gap-6">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between">
                  <Label htmlFor={field.id} className="flex flex-col space-y-1">
                    <span>{FIELD_LABELS[field.field_name] || field.field_name}</span>
                    <span className="text-sm text-muted-foreground">
                      Campo: {field.field_name}
                    </span>
                  </Label>
                  <Switch
                    id={field.id}
                    checked={field.visible}
                    onCheckedChange={(checked) => handleFieldVisibilityChange(field.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
