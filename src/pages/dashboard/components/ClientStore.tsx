
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
      </CardContent>
    </Card>
  );
};
