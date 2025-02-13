
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ClientFormData } from "../types/client.types";

interface Props {
  formData: ClientFormData;
  onFormChange: (name: string, value: any) => void;
  editingId: string | null;
}

export const ClientAccess = ({
  formData,
  onFormChange,
  editingId
}: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso à Área do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="client_login">Login</Label>
            <Input
              id="client_login"
              name="client_login"
              value={formData.client_login}
              onChange={(e) => onFormChange('client_login', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_password">Senha</Label>
            <Input
              id="client_password"
              name="client_password"
              type="password"
              value={formData.client_password}
              onChange={(e) => onFormChange('client_password', e.target.value)}
              className="h-9"
              placeholder={editingId ? "Digite para alterar a senha" : ""}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
