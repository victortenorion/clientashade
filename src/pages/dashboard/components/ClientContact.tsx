
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IMaskInput } from "react-imask";
import { ClientFormData } from "../types/client.types";

interface Props {
  formData: ClientFormData;
  onFormChange: (name: string, value: any) => void;
}

export const ClientContact = ({
  formData,
  onFormChange
}: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="phone_landline">Telefone Fixo</Label>
            <IMaskInput
              id="phone_landline"
              name="phone_landline"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.phone_landline}
              mask="(00) 0000-0000"
              onAccept={(value) => onFormChange('phone_landline', value)}
              placeholder="Digite o telefone fixo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile_phone">Celular</Label>
            <IMaskInput
              id="mobile_phone"
              name="mobile_phone"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.mobile_phone}
              mask="(00) 00000-0000"
              onAccept={(value) => onFormChange('mobile_phone', value)}
              placeholder="Digite o celular"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange('email', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_carrier">Operadora</Label>
            <Input
              id="phone_carrier"
              name="phone_carrier"
              value={formData.phone_carrier}
              onChange={(e) => onFormChange('phone_carrier', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={(e) => onFormChange('website', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nfe_email">Email NFe</Label>
            <Input
              id="nfe_email"
              name="nfe_email"
              type="email"
              value={formData.nfe_email}
              onChange={(e) => onFormChange('nfe_email', e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
