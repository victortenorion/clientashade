import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FilePlus, Plus, Search, FileDown, FileUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceOrderStatus } from "@/types/service-order";
import { getStatusColor } from "@/lib/utils";
import { ImportServiceOrdersDialog } from "./components/ImportServiceOrdersDialog";
import { ExportServiceOrdersDialog } from "./components/ExportServiceOrdersDialog";

interface ServiceOrder {
  id: string;
  created_at: string;
  client_name: string;
  device: string;
  status: ServiceOrderStatus;
  protocol: string;
}

const ServiceOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const columns: ColumnDef<ServiceOrder>[] = [
    {
      accessorKey: "protocol",
      header: "Protocolo",
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => {
        return format(new Date(row.getValue("created_at")), "dd/MM/yyyy HH:mm", {
          locale: ptBR,
        });
      },
    },
    {
      accessorKey: "client_name",
      header: "Cliente",
    },
    {
      accessorKey: "device",
      header: "Equipamento",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as ServiceOrderStatus;
        return (
          <Badge variant="outline" className={getStatusColor(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              navigate(`/dashboard/service-orders/${row.original.id}`)
            }
          >
            Detalhes
          </Button>
        );
      },
    },
  ];

  const fetchServiceOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("service_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `client_name.ilike.%${searchTerm}%,protocol.ilike.%${searchTerm}%,device.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setServiceOrders(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar ordens de serviço:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceOrders();
  }, [searchTerm]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Ordens</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/dashboard/service-orders/csv")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FilePlus className="h-4 w-4" />
            Nova Ordem (CSV)
          </Button>
          <Button
            onClick={() => navigate("/dashboard/service-orders/new")}
            variant="default"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Ordem
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ordens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setShowImportDialog(true)}
          >
            <FileUp className="h-4 w-4" />
            Importar
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setShowExportDialog(true)}
          >
            <FileDown className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={serviceOrders} loading={loading} />

      <ImportServiceOrdersDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={fetchServiceOrders}
      />

      <ExportServiceOrdersDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </div>
  );
};

export default ServiceOrders;
