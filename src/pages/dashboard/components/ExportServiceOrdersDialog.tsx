
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExportServiceOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportServiceOrdersDialog = ({
  open,
  onOpenChange,
}: ExportServiceOrdersDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Ordens de Serviço</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Export functionality will be implemented later */}
          <p>Funcionalidade em desenvolvimento...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
