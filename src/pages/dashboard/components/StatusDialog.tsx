
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Status } from "../types/service-order-settings.types";

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: Status | null;
  onSave: (status: Partial<Status>) => void;
}

export const StatusDialog = ({ open, onOpenChange, status, onSave }: StatusDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    color: "#000000",
    description: "",
  });

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name,
        color: status.color || "#000000",
        description: status.description || "",
      });
    } else {
      setFormData({
        name: "",
        color: "#000000",
        description: "",
      });
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(status ? { ...formData, id: status.id } : formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {status ? "Editar Status" : "Novo Status"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                name="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit">
              {status ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
