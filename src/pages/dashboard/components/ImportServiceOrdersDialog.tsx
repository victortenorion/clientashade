
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportServiceOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ImportServiceOrdersDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: ImportServiceOrdersDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Ordens de Serviço</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Import functionality will be implemented later */}
          <p>Funcionalidade em desenvolvimento...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
