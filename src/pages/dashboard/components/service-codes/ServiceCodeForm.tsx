
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";
import { ServiceCode, ServiceCodeFormData } from "./types";

interface ServiceCodeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  formData: ServiceCodeFormData;
  setFormData: (data: ServiceCodeFormData) => void;
  selectedCode: ServiceCode | null;
}

export function ServiceCodeForm({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  selectedCode,
}: ServiceCodeFormProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedCode ? "Editar Código de Serviço" : "Novo Código de Serviço"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliquota">Alíquota ISS (%)</Label>
            <Input
              id="aliquota"
              type="number"
              step="0.01"
              value={formData.aliquota_iss}
              onChange={(e) =>
                setFormData({ ...formData, aliquota_iss: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
