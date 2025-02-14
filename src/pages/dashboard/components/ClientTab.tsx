
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ClientField {
  id: string;
  label: string;
  field: string;
  visible: boolean;
}

interface ClientTabProps {
  clientFields: ClientField[];
  onFieldVisibilityChange: (field: string, checked: boolean) => void;
}

export const ClientTab: React.FC<ClientTabProps> = ({
  clientFields,
  onFieldVisibilityChange,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="text-lg font-semibold mb-4">
              Campos Visíveis na Listagem de Clientes
            </div>
            <div className="grid gap-6">
              {clientFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between">
                  <Label htmlFor={field.id} className="flex flex-col space-y-1">
                    <span>{field.label}</span>
                    <span className="text-sm text-muted-foreground">
                      Campo: {field.field}
                    </span>
                  </Label>
                  <Switch
                    id={field.id}
                    checked={field.visible}
                    onCheckedChange={(checked) => onFieldVisibilityChange(field.field, checked)}
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
