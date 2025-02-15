
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface ExportServiceOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportServiceOrdersDialog({ open, onOpenChange }: ExportServiceOrdersDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setLoading(true);

      // TODO: Implementar lógica de exportação
      toast({
        title: "Exportação em desenvolvimento",
        description: "Esta funcionalidade será implementada em breve."
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar dados",
        description: error.message
      });
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Ordens de Serviço</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading}
          >
            Exportar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
