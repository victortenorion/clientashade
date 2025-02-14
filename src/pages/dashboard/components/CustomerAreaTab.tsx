
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CustomerAreaField } from "../types/service-order-settings.types";

export const CustomerAreaTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<CustomerAreaField[]>([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customer_area_field_settings")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar campos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar campos",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldVisibilityChange = async (field: CustomerAreaField, checked: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("customer_area_field_settings")
        .upsert({
          id: field.id,
          field_name: field.field_name,
          visible: checked
        });

      if (error) throw error;

      toast({
        title: "Campo atualizado",
        description: "A visibilidade do campo foi atualizada com sucesso."
      });

      await fetchFields();
    } catch (error: any) {
      console.error("Erro ao atualizar campo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar campo",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-lg font-semibold mb-4">
          Campos Visíveis na Área do Cliente
        </div>
        <div className="grid gap-6">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center justify-between">
              <Label htmlFor={field.id} className="flex flex-col space-y-1">
                <span>{field.field_name}</span>
              </Label>
              <Switch
                id={field.id}
                checked={field.visible}
                onCheckedChange={(checked) => handleFieldVisibilityChange(field, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
