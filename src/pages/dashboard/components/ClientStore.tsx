
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { IMaskInput } from "react-imask";
import { ClientFormData, Store } from "../types/client.types";

interface Props {
  formData: ClientFormData;
  stores: Store[];
  onFormChange: (name: string, value: any) => void;
}

export const ClientStore = ({
  formData,
  stores,
  onFormChange
}: Props) => {
  const selectedStore = stores.find(store => store.id === formData.store_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="store_id">Loja *</Label>
          <select
            id="store_id"
            name="store_id"
            value={formData.store_id || ""}
            onChange={(e) => onFormChange('store_id', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">Selecione uma loja</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {selectedStore && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Informações da Loja Selecionada:</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Inscrição Municipal</Label>
                <p className="text-sm text-gray-600">{selectedStore.inscricao_municipal || '-'}</p>
              </div>
              
              <div>
                <Label>Documento</Label>
                <p className="text-sm text-gray-600">
                  {selectedStore.tipo_documento}: {selectedStore.documento || '-'}
                </p>
              </div>

              <div>
                <Label>Regime Tributário</Label>
                <p className="text-sm text-gray-600">{selectedStore.regime_tributario || '-'}</p>
              </div>

              <div>
                <Label>CNAE</Label>
                <p className="text-sm text-gray-600">{selectedStore.cnae || '-'}</p>
              </div>

              <div>
                <Label>Código do Município</Label>
                <p className="text-sm text-gray-600">{selectedStore.codigo_municipio || '-'}</p>
              </div>

              <div>
                <Label>Alíquota ISS</Label>
                <p className="text-sm text-gray-600">
                  {selectedStore.aliquota_iss ? `${selectedStore.aliquota_iss}%` : '-'}
                </p>
              </div>

              <div>
                <Label>ISS Retido</Label>
                <p className="text-sm text-gray-600">
                  {selectedStore.iss_retido ? 'Sim' : 'Não'}
                </p>
              </div>

              <div>
                <Label>Incentivador Cultural</Label>
                <p className="text-sm text-gray-600">
                  {selectedStore.incentivador_cultural ? 'Sim' : 'Não'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
