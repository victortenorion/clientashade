
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

interface ClientField {
  id: string;
  field_name: string;
  visible: boolean;
}

const defaultFields = [
  { field_name: "name", label: "Nome" },
  { field_name: "fantasy_name", label: "Nome Fantasia" },
  { field_name: "email", label: "E-mail" },
  { field_name: "phone", label: "Telefone" },
  { field_name: "document", label: "Documento" },
  { field_name: "person_type", label: "Tipo de Pessoa" },
  { field_name: "state_registration", label: "Inscrição Estadual" },
  { field_name: "municipal_registration", label: "Inscrição Municipal" },
  { field_name: "zip_code", label: "CEP" },
  { field_name: "state", label: "Estado" },
  { field_name: "city", label: "Cidade" },
  { field_name: "neighborhood", label: "Bairro" },
  { field_name: "street", label: "Rua" },
  { field_name: "street_number", label: "Número" },
  { field_name: "complement", label: "Complemento" },
  { field_name: "contact_info", label: "Informações de Contato" },
  { field_name: "contact_persons", label: "Pessoas de Contato" },
  { field_name: "phone_landline", label: "Telefone Fixo" },
  { field_name: "fax", label: "Fax" },
  { field_name: "mobile_phone", label: "Celular" },
  { field_name: "phone_carrier", label: "Operadora" },
  { field_name: "website", label: "Website" },
  { field_name: "nfe_email", label: "E-mail NFe" },
];

export const ClientFieldsTab = () => {
  const { toast } = useToast();
  const [fields, setFields] = useState<ClientField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const { data: existingFields, error } = await supabase
        .from("client_registration_field_settings")
        .select("*");

      if (error) throw error;

      if (!existingFields || existingFields.length === 0) {
        // Se não houver campos configurados, criar com os valores padrão
        const defaultFieldsData = defaultFields.map(field => ({
          field_name: field.field_name,
          visible: true,
        }));

        const { data: insertedFields, error: insertError } = await supabase
          .from("client_registration_field_settings")
          .insert(defaultFieldsData)
          .select();

        if (insertError) throw insertError;
        
        setFields(insertedFields || []);
      } else {
        setFields(existingFields);
      }
    } catch (error: any) {
      console.error("Erro ao carregar campos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar campos",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldVisibilityChange = async (fieldId: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from("client_registration_field_settings")
        .update({ visible })
        .eq("id", fieldId);

      if (error) throw error;

      setFields(fields.map(field => 
        field.id === fieldId ? { ...field, visible } : field
      ));

      toast({
        title: "Campo atualizado com sucesso",
        description: "A visibilidade do campo foi alterada.",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar campo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar campo",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Campos do Cadastro de Clientes</h3>
        <p className="text-sm text-muted-foreground">
          Configure quais campos serão exibidos no formulário de cadastro de clientes.
        </p>
      </div>
      <div className="space-y-4">
        {fields.map((field) => {
          const defaultField = defaultFields.find(f => f.field_name === field.field_name);
          return (
            <div key={field.id} className="flex items-center justify-between">
              <Label htmlFor={field.id}>
                {defaultField?.label || field.field_name}
              </Label>
              <Switch
                id={field.id}
                checked={field.visible}
                onCheckedChange={(checked) => handleFieldVisibilityChange(field.id, checked)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
