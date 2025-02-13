
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IMaskInput } from "react-imask";
import { ClientFormData } from "../types/client.types";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  formData: ClientFormData;
  onFormChange: (name: string, value: any) => void;
  onCEPChange: (cep: string) => void;
}

export const ClientAddress = ({
  formData,
  onFormChange,
  onCEPChange
}: Props) => {
  const { toast } = useToast();

  const fetchAddressData = async (cep: string) => {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) return;

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          variant: "destructive",
          title: "CEP não encontrado",
          description: "Verifique o CEP informado e tente novamente."
        });
        return;
      }

      onFormChange('street', data.logradouro);
      onFormChange('neighborhood', data.bairro);
      onFormChange('city', data.localidade);
      onFormChange('state', data.uf);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar os dados do CEP. Tente novamente."
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endereço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP</Label>
            <IMaskInput
              id="zip_code"
              name="zip_code"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.zip_code}
              mask="00000-000"
              onAccept={(value) => {
                onCEPChange(value);
                fetchAddressData(value);
              }}
              placeholder="Digite o CEP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">UF</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={(e) => onFormChange('state', e.target.value)}
              maxLength={2}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={(e) => onFormChange('city', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => onFormChange('neighborhood', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3 space-y-2">
            <Label htmlFor="street">Logradouro</Label>
            <Input
              id="street"
              name="street"
              value={formData.street}
              onChange={(e) => onFormChange('street', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street_number">Número</Label>
            <Input
              id="street_number"
              name="street_number"
              value={formData.street_number}
              onChange={(e) => onFormChange('street_number', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            name="complement"
            value={formData.complement}
            onChange={(e) => onFormChange('complement', e.target.value)}
            className="h-9"
          />
        </div>
      </CardContent>
    </Card>
  );
};
