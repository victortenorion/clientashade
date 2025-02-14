
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Status } from "../types/service-order-settings.types";
import { StatusDialog } from "./StatusDialog";

interface StatusTabProps {
  statuses: Status[];
  loading: boolean;
  onDelete: (id: string) => void;
  onSave: (status: Partial<Status>) => void;
}

export const StatusTab = ({ statuses, loading, onDelete, onSave }: StatusTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);

  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Status</h3>
          <Button onClick={() => {
            setEditingStatus(null);
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Status
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : statuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhum status encontrado
                  </TableCell>
                </TableRow>
              ) : (
                statuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell className="font-medium">{status.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.color}
                      </div>
                    </TableCell>
                    <TableCell>{status.description}</TableCell>
                    <TableCell>
                      {status.is_active ? (
                        <span className="text-green-600">Ativo</span>
                      ) : (
                        <span className="text-red-600">Inativo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(status)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => onDelete(status.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <StatusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        status={editingStatus}
        onSave={onSave}
      />
    </div>
  );
};
