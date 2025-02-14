
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const StatusTab = () => {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_order_statuses")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar status",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status: Partial<Status>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("service_order_statuses")
        .upsert({
          id: status.id,
          name: status.name,
          color: status.color,
          description: status.description,
          is_active: status.is_active
        });

      if (error) throw error;

      toast({
        title: "Status salvo",
        description: "O status foi salvo com sucesso."
      });

      await fetchStatuses();
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao salvar status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar status",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("service_order_statuses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status excluído",
        description: "O status foi excluído com sucesso."
      });

      await fetchStatuses();
    } catch (error: any) {
      console.error("Erro ao excluir status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir status",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
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
                            onClick={() => {
                              setEditingStatus(status);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(status.id)}
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
        </CardContent>
      </Card>

      <StatusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        status={editingStatus}
        onSave={handleSave}
      />
    </div>
  );
};
