
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

  const handleSearchDocument = async (document: string) => {
    try {
      setSearchingDocument(true);
      const { data, error } = await supabase.functions.invoke('document-search', {
        body: { document }
      });

      if (error) throw error;

      if (data.results && data.results.length > 0) {
        const existingClient = data.results[0];
        handleEdit(existingClient);
        toast({
          title: "Cliente encontrado",
          description: "Os dados foram carregados para edição.",
        });
        return;
      }

      if (data.apiData) {
        const { name, email, phone, address } = data.apiData;
        setFormData(prev => ({
          ...prev,
          name: name || prev.name,
          email: email || prev.email,
          phone: phone || prev.phone,
          ...(address ? parseAddress(address) : {})
        }));
        toast({
          title: "Dados encontrados",
          description: "Os campos foram preenchidos automaticamente.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: error.message,
      });
    } finally {
      setSearchingDocument(false);
    }
  };

  const parseAddress = (address: string) => {
    try {
      // Exemplo: "RUA EXEMPLO 123, BAIRRO, CIDADE - UF, 12345-678"
      const parts = address.split(',');
      
      // Processa rua e número
      const streetWithNumber = parts[0].trim();
      const streetMatch = streetWithNumber.match(/(.*?)(\d+)\s*$/);
      const street = streetMatch ? streetMatch[1].trim() : streetWithNumber;
      const number = streetMatch ? streetMatch[2] : '';
      
      // Processa bairro
      const neighborhood = parts[1]?.trim() || '';
      
      // Processa cidade e estado
      const cityState = parts[2]?.trim() || '';
      const [city, stateWithCep] = cityState.split('-').map(s => s.trim());
      
      // Processa estado e CEP
      const [state, cep] = stateWithCep ? stateWithCep.split(',').map(s => s.trim()) : ['', ''];

      return {
        street,
        street_number: number,
        complement: '',
        neighborhood,
        city: city || '',
        state: state || '',
        zip_code: cep ? cep.replace(/\D/g, '') : ''
      };
    } catch (error) {
      console.error('Erro ao parsear endereço:', error);
      return {};
    }
  };

  useEffect(() => {
    fetchClients();
    fetchStores();
    fetchVisibleFields();
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Button onClick={() => {
          setFormData(defaultFormData);
          setEditingId(null);
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.document}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(client.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ClientBasicInfo
              formData={formData}
              onFormChange={handleInputChange}
              onSearchDocument={handleSearchDocument}
              searchingDocument={searchingDocument}
              editingId={editingId}
            />
            <ClientAddress
              formData={formData}
              onFormChange={handleInputChange}
              onCEPChange={(cep) => {
                // Implementar busca por CEP
                console.log("Buscar CEP:", cep);
              }}
            />
            <ClientContact
              formData={formData}
              onFormChange={handleInputChange}
            />
            <ClientAccess
              formData={formData}
              onFormChange={handleInputChange}
              editingId={editingId}
            />
            <ClientStore
              formData={formData}
              stores={stores}
              onFormChange={handleInputChange}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.withOrders ? (
                <>
                  Este cliente possui ordens de serviço. Para excluí-lo, você precisará
                  informar a senha de administrador.
                  <Input
                    type="password"
                    placeholder="Senha de administrador"
                    value={deleteDialog.adminPassword}
                    onChange={(e) =>
                      setDeleteDialog((prev) => ({
                        ...prev,
                        adminPassword: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </>
              ) : (
                "Tem certeza que deseja excluir este cliente?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
