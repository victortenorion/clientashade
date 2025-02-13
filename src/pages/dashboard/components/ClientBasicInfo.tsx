
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { IMaskInput } from "react-imask";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientFormData } from "../types/client.types";

interface Props {
  formData: ClientFormData;
  onFormChange: (name: string, value: any) => void;
  onSearchDocument: (document: string) => void;
  searchingDocument: boolean;
  editingId: string | null;
}

export const ClientBasicInfo = ({
  formData,
  onFormChange,
  onSearchDocument,
  searchingDocument,
  editingId
}: Props) => {
  const handleDocumentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.document) {
      e.preventDefault();
      onSearchDocument(formData.document);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Básicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="document">CPF/CNPJ</Label>
          <div className="flex gap-2">
            <IMaskInput
              id="document"
              name="document"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.document}
              mask={[
                { mask: '000.000.000-00', maxLength: 14 },
                { mask: '00.000.000/0000-00', maxLength: 18 }
              ]}
              onAccept={(value) => onFormChange('document', value)}
              onKeyPress={handleDocumentKeyPress}
              placeholder="Digite o CPF ou CNPJ"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={searchingDocument || !formData.document}
              onClick={() => onSearchDocument(formData.document)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="name">Nome/Razão Social</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              required
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fantasy_name">Nome Fantasia</Label>
            <Input
              id="fantasy_name"
              name="fantasy_name"
              value={formData.fantasy_name}
              onChange={(e) => onFormChange('fantasy_name', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="state_registration">Inscrição Estadual</Label>
            <Input
              id="state_registration"
              name="state_registration"
              value={formData.state_registration}
              onChange={(e) => onFormChange('state_registration', e.target.value)}
              disabled={formData.state_registration_exempt}
              className="h-9"
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Checkbox
              id="state_registration_exempt"
              checked={formData.state_registration_exempt}
              onCheckedChange={(checked) => {
                onFormChange('state_registration_exempt', checked);
                if (checked) {
                  onFormChange('state_registration', '');
                }
              }}
            />
            <Label htmlFor="state_registration_exempt">IE Isento</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="municipal_registration">Inscrição Municipal</Label>
          <Input
            id="municipal_registration"
            name="municipal_registration"
            value={formData.municipal_registration}
            onChange={(e) => onFormChange('municipal_registration', e.target.value)}
            className="h-9"
          />
        </div>
      </CardContent>
    </Card>
  );
};
