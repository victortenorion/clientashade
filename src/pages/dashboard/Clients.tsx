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
  Store
} from "./types/client.types";
import {
  defaultFormData,
  getFieldLabel,
  formatDocument,
  getLastFourDigits
} from "./utils/client.utils";

const Clients = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchingDocument, setSearchingDocument] = useState(false);
  const [visibleFields, setVisibleFields] = useState<{ field_name: string, visible: boolean }[]>([]);
  const { toast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    clientId: null,
    withOrders: false,
    adminPassword: ''
  });

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar lojas",
        description: error.message,
      });
    }
  };

  const fetchVisibleFields = async () => {
    try {
      const { data, error } = await supabase
        .from('client_field_settings')
        .select('field_name, visible')
        .order('field_name');

      if (error) throw error;
      setVisibleFields(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações dos campos",
        description: error.message,
      });
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .ilike("name", `%${searchTerm}%`);

      if (error) throw error;

      const typedData = data?.map(client => ({
        ...client,
        contact_persons: client.contact_persons as unknown as ContactPerson[] | null,
        store_id: client.store_id || null
      })) as Client[];

      setClients(typedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    if (name === 'email') {
      if (formData.client_login === '' || formData.client_login === formData.email) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          client_login: value
        }));
        return;
      }
    }
    
    if (name === 'phone') {
      if (!editingId && (!formData.client_password || formData.client_password === getLastFourDigits(formData.phone))) {
        const lastFour = getLastFourDigits(value);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          client_password: lastFour
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = async (id: string) => {
    const { data: serviceOrders, error: checkError } = await supabase
      .from("service_orders")
      .select("id")
      .eq("client_id", id);

    if (checkError) {
      toast({
        variant: "destructive",
        title: "Erro ao verificar ordens de serviço",
        description: checkError.message,
      });
      return;
    }

    setDeleteDialog({
      isOpen: true,
      clientId: id,
      withOrders: serviceOrders && serviceOrders.length > 0,
      adminPassword: ''
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog.clientId) return;

    try {
      if (deleteDialog.withOrders) {
        if (!deleteDialog.adminPassword || deleteDialog.adminPassword !== 'admin123') {
          toast({
            variant: "destructive",
            title: "Senha incorreta",
            description: "A senha de administrador está incorreta.",
          });
          return;
        }

        const { error: ordersError } = await supabase
          .from("service_orders")
          .delete()
          .eq("client_id", deleteDialog.clientId);

        if (ordersError) throw ordersError;
      }

      const { error: clientError } = await supabase
        .from("clients")
        .delete()
        .eq("id", deleteDialog.clientId);

      if (clientError) throw clientError;

      toast({
        title: "Cliente excluído com sucesso",
        description: deleteDialog.withOrders ? 
          "O cliente e suas ordens de serviço foram excluídos." : 
          "O cliente foi excluído.",
      });
      
      setDeleteDialog({
        isOpen: false,
        clientId: null,
        withOrders: false,
        adminPassword: ''
      });
      
      fetchClients();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir cliente",
        description: error.message,
      });
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      fantasy_name: client.fantasy_name || "",
      email: client.email || "",
      phone: client.phone || "",
      document: client.document || "",
      client_login: client.client_login || client.email || "",
      client_password: "",
      person_type: client.person_type || 'PF',
      state_registration: client.state_registration || "",
      state_registration_exempt: client.state_registration_exempt || false,
      municipal_registration: client.municipal_registration || "",
      zip_code: client.zip_code || "",
      state: client.state || "",
      city: client.city || "",
      neighborhood: client.neighborhood || "",
      street: client.street || "",
      street_number: client.street_number || "",
      complement: client.complement || "",
      contact_info: client.contact_info || "",
      contact_persons: client.contact_persons || [],
      phone_landline: client.phone_landline || "",
      fax: client.fax || "",
      mobile_phone: client.mobile_phone || "",
      phone_carrier: client.phone_carrier || "",
      website: client.website || "",
      nfe_email: client.nfe_email || "",
      store_id: client.store_id || ""
    });
    setEditingId(client.id);
    setDialogOpen(true);
  };

  return (
    <div>
      {/* Component content */}
    </div>
  );
};

export default Clients;
