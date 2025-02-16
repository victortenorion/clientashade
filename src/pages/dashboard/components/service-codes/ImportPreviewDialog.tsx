
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Upload } from "lucide-react";
import { ImportPreviewData } from "./types";

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  importPreviewData: ImportPreviewData[];
}

export function ImportPreviewDialog({
  isOpen,
  onClose,
  onConfirm,
  importPreviewData,
}: ImportPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Prévia da Importação</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[120px] text-right">Alíquota ISS</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importPreviewData.map((item, index) => (
                <TableRow key={index} className={item.isValid ? "" : "bg-destructive/10"}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.aliquota_iss}%</TableCell>
                  <TableCell>
                    {item.isValid ? (
                      <span className="text-green-600">Válido</span>
                    ) : (
                      <span className="text-destructive text-sm">{item.error}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            <Upload className="h-4 w-4 mr-2" />
            Confirmar Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
