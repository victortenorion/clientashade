import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientBasicInfo } from "./components/ClientBasicInfo";
import { ClientAddress } from "./components/ClientAddress";
import { ClientContact } from "./components/ClientContact";
import { ClientAccess } from "./components/ClientAccess";
import { ClientStore } from "./components/ClientStore";
import {
  Client,
  ClientFormData,
  DeleteDialogState,
  Store,
  ContactPerson
} from "./types/client.types";
import {
  defaultFormData,
  getFieldLabel,
  formatFieldValue,
  getLastFourDigits
} from "./utils/client.utils";
import { Json } from "@/integrations/supabase/types";

interface VisibleField {
  field_name: string;
  visible: boolean;
}

const ServiceOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceOrderFormData>(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const orderData = {
        client_id: selectedClient?.id,
        equipment: formData.equipment,
        equipment_serial_number: formData.equipment_serial_number,
        problem: formData.problem,
        description: formData.description,
        status_id: formData.status_id,
        priority: formData.priority,
        expected_date: formData.expected_date,
        store_id: formData.store_id
      };

      if (editingId) {
        const { error } = await supabase
          .from("service_orders")
          .update(orderData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Ordem de serviço atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("service_orders")
          .insert([orderData]);

        if (error) throw error;

        toast({
          title: "Ordem de serviço criada com sucesso",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao processar ordem de serviço",
        description: error.message
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Rest of your JSX */}
    </div>
  );
};

export default ServiceOrders;
