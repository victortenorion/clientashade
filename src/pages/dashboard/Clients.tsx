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
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { IMaskInput } from "react-imask";
import { supabase } from "@/integrations/supabase/client";
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

interface Store {
  id: string;
  name: string;
}

interface ContactPerson {
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface Client {
  id: string;
  name: string;
  fantasy_name: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  client_login: string | null;
  client_password: string | null;
  person_type: 'PF' | 'PJ' | null;
  state_registration: string | null;
  state_registration_exempt: boolean;
  municipal_registration: string | null;
  zip_code: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  street_number: string | null;
  complement: string | null;
  contact_info: string | null;
  contact_persons: ContactPerson[] | null;
  phone_landline: string | null;
  fax: string | null;
  mobile_phone: string | null;
  phone_carrier: string | null;
  website: string | null;
  nfe_email: string | null;
  store_id: string | null;
}

interface ClientFormData {
  name: string;
  fantasy_name: string;
  email: string;
  phone: string;
  document: string;
  client_login: string;
  client_password: string;
  person_type: 'PF' | 'PJ';
  state_registration: string;
  state_registration_exempt: boolean;
  municipal_registration: string;
  zip_code: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  street_number: string;
  complement: string;
  contact_info: string;
  contact_persons: ContactPerson[];
  phone_landline: string;
  fax: string;
  mobile_phone: string;
  phone_carrier: string;
  website: string;
  nfe_email: string;
  store_id: string;
}

const defaultFormData: ClientFormData = {
  name: "",
  fantasy_name: "",
  email: "",
  phone: "",
  document: "",
  client_login: "",
  client_password: "",
  person_type: 'PF',
  state_registration: "",
  state_registration_exempt: false,
  municipal_registration: "",
  zip_code: "",
  state: "",
  city: "",
  neighborhood: "",
  street: "",
  street_number: "",
  complement: "",
  contact_info: "",
  contact_persons: [],
  phone_landline: "",
  fax: "",
  mobile_phone: "",
  phone_carrier: "",
  website: "",
  nfe_email: "",
  store_id: "",
};

const getLastFourDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
};

const formatDocument = (doc: string) => {
  const cleanDoc = doc.replace(/\D/g, '');
  if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
};

interface DeleteDialogState {
  isOpen: boolean;
  clientId: string | null;
  withOrders: boolean;
  adminPassword: string;
}

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

  const getFieldLabel = (fieldName: string) => {
    const labels: { [key: string]: string } = {
      name: "Nome",
      email: "Email",
      phone: "Telefone",
      document: "Documento",
      fantasy_name: "Nome Fantasia",
      state_registration: "Inscrição Estadual",
      municipal_registration: "Inscrição Municipal",
      zip_code: "CEP",
      state: "Estado",
      city: "Cidade",
      neighborhood: "Bairro",
      street: "Logradouro",
      street_number: "Número",
      complement: "Complemento",
      phone_landline: "Telefone Fixo",
      fax: "Fax",
      mobile_phone: "Celular",
      phone_carrier: "Operadora",
      website: "Website",
      nfe_email: "Email NFe",
      client_login: "Login do Cliente"
    };
    return labels[fieldName] || fieldName;
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .ilike("name", `%${searchTerm}%`);

      if (error) throw error;

      // Converter o tipo do contact_persons de Json para ContactPerson[]
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      // Atualiza o client_login com o email, a menos que tenha sido personalizado
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
      // Atualiza a senha com os últimos 4 dígitos do telefone se estiver criando novo cliente
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

  const handleDocumentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.document) {
      e.preventDefault();
      searchDocument(formData.document);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = async (id: string) => {
    // Primeiro, verifica se o cliente possui ordens de serviço
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
        // Verifica a senha do administrador
        if (!deleteDialog.adminPassword || deleteDialog.adminPassword !== 'admin123') {
          toast({
            variant: "destructive",
            title: "Senha incorreta",
            description: "A senha de administrador está incorreta.",
          });
          return;
        }

        // Primeiro deleta as ordens de serviço
        const { error: ordersError } = await supabase
          .from("service_orders")
          .delete()
          .eq("client_id", deleteDialog.clientId);

        if (ordersError) throw ordersError;
      }

      // Depois deleta o cliente
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
      client_password: "", // Não preenchemos a senha por segurança
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
      store_id: client.store_id || "",
    });
    setEditingId(client.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { 
        ...formData,
        person_type: formData.document.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ'
      };
      
      if (editingId && !dataToSend.client_password) {
        delete dataToSend.client_password;
      }

      if (editingId) {
        const { error } = await supabase
          .from("clients")
          .update(dataToSend as any)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Cliente atualizado com sucesso",
        });
      } else {
        const { data: existingClient, error: checkError } = await supabase
          .from("clients")
          .select("id")
          .eq("client_login", formData.client_login)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingClient) {
          toast({
            variant: "destructive",
            title: "Login já existe",
            description: "Por favor, escolha outro login para o cliente.",
          });
          return;
        }

        const { error } = await supabase
          .from("clients")
          .insert(dataToSend as any);

        if (error) throw error;

        toast({
          title: "Cliente criado com sucesso",
        });
      }

      setDialogOpen(false);
      setFormData(defaultFormData);
      setEditingId(null);
      fetchClients();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingId ? "Erro ao atualizar cliente" : "Erro ao criar cliente",
        description: error.message,
      });
    }
  };

  const handleNewClient = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setDialogOpen(true);
  };

  const searchDocument = async (document: string) => {
    try {
      setSearchingDocument(true);
      const { data, error } = await supabase.functions.invoke('document-search', {
        body: { document }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Erro na busca",
          description: data.error,
        });
        return;
      }

      if (data.results && data.results.length > 0) {
        toast({
          title: "Cliente(s) encontrado(s)",
          description: `${data.results.length} cliente(s) encontrado(s) com este documento.`,
        });
        
        // Atualiza a lista de clientes encontrados
        const typedResults = data.results.map((client: any) => ({
          ...client,
          contact_persons: (client.contact_persons || []) as ContactPerson[]
        }));
        setClients(typedResults);
      }

      if (data.apiData) {
        const cleanDoc = document.replace(/[^\d]/g, '');
        const personType = cleanDoc.length === 11 ? 'PF' : 'PJ';

        // Extrai o telefone limpo (apenas números)
        const cleanPhone = data.apiData.phone ? data.apiData.phone.replace(/\D/g, '') : '';
        
        // Gera a senha padrão (últimos 4 dígitos do telefone ou primeiros 4 dígitos do documento)
        const defaultPassword = cleanPhone.length >= 4 
          ? cleanPhone.slice(-4) 
          : cleanDoc.slice(0, 4);

        setFormData(prev => ({
          ...prev,
          name: data.apiData.name || prev.name,
          fantasy_name: "", // API não retorna nome fantasia
          email: data.apiData.email || prev.email,
          phone: data.apiData.phone || prev.phone,
          document: formatDocument(document),
          client_login: data.apiData.email || prev.client_login,
          client_password: !editingId ? defaultPassword : prev.client_password,
          person_type: personType,
          state_registration: "", // Precisa ser preenchido manualmente
          state_registration_exempt: false,
          municipal_registration: "", // Precisa ser preenchido manualmente
          zip_code: data.apiData.address?.match(/\d{5}-?\d{3}/)?.shift() || prev.zip_code,
          state: data.apiData.address?.match(/[A-Z]{2}(?=\s*$)/)?.shift() || prev.state,
          city: data.apiData.address ? 
            data.apiData.address.split(',').slice(-2)[0].trim().replace(/^[A-Z]{2}/, '').trim() : 
            prev.city,
          neighborhood: data.apiData.address ? 
            data.apiData.address.split('-').slice(-2)[0].trim() : 
            prev.neighborhood,
          street: data.apiData.address ? 
            data.apiData.address.split(',')[0].split('-')[0].trim() : 
            prev.street,
          street_number: data.apiData.address ? 
            data.apiData.address.match(/,\s*(\d+)/)?.[1] || "" : 
            prev.street_number,
          complement: "", // API não retorna complemento
          contact_info: "", // API não retorna informações adicionais de contato
          contact_persons: [], // API não retorna pessoas de contato
          phone_landline: data.apiData.phone || prev.phone_landline,
          fax: "", // API não retorna fax
          mobile_phone: "", // API não retorna celular
          phone_carrier: "", // API não retorna operadora
          website: "", // API não retorna website
          nfe_email: data.apiData.email || prev.nfe_email,
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

  const searchCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          variant: "destructive",
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        state: data.uf,
        city: data.localidade,
        neighborhood: data.bairro,
        street: data.logradouro,
      }));

      toast({
        title: "Endereço encontrado",
        description: "Os campos foram preenchidos automaticamente",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar CEP",
        description: "Ocorreu um erro ao buscar o endereço",
      });
    }
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, zip_code: value }));
    
    if (value.replace(/\D/g, '').length === 8) {
      searchCEP(value);
    }
  };

  useEffect(() => {
    fetchVisibleFields();
    fetchStores();
    fetchClients();
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Clientes</h2>
        <Button onClick={handleNewClient}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar clientes..."
          className="max-w-sm"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleFields
                .filter(field => field.visible)
                .sort((a, b) => {
                  // Nome sempre primeiro
                  if (a.field_name === 'name') return -1;
                  if (b.field_name === 'name') return 1;
                  // Telefone/Celular sempre segundo
                  if ((a.field_name === 'phone' || a.field_name === 'mobile_phone') && 
                      b.field_name !== 'name') return -1;
                  if ((b.field_name === 'phone' || b.field_name === 'mobile_phone') && 
                      a.field_name !== 'name') return 1;
                  // Resto mantém a ordem original
                  return 0;
                })
                .map(field => (
                  <TableHead key={field.field_name}>{getFieldLabel(field.field_name)}</TableHead>
              ))}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleFields.filter(f => f.visible).length + 1} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleFields.filter(f => f.visible).length + 1} className="text-center">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  {visibleFields
                    .filter(field => field.visible)
                    .sort((a, b) => {
                      // Nome sempre primeiro
                      if (a.field_name === 'name') return -1;
                      if (b.field_name === 'name') return 1;
                      // Telefone/Celular sempre segundo
                      if ((a.field_name === 'phone' || a.field_name === 'mobile_phone') && 
                          b.field_name !== 'name') return -1;
                      if ((b.field_name === 'phone' || b.field_name === 'mobile_phone') && 
                          a.field_name !== 'name') return 1;
                      // Resto mantém a ordem original
                      return 0;
                    })
                    .map(field => (
                      <TableCell key={field.field_name}>
                        {client[field.field_name as keyof Client]?.toString() || ''}
                      </TableCell>
                  ))}
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados Básicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="document">CPF/CNPJ</Label>
                  <div className="flex gap-2">
                    <IMaskInput
                      id="document"
                      name="document"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.document}
                      mask={[
                        { mask: '000.000.000-00', maxLength: 14 },
                        { mask: '00.000.000/0000-00', maxLength: 18 }
                      ]}
                      onAccept={(value) => setFormData(prev => ({ ...prev, document: value }))}
                      onKeyPress={handleDocumentKeyPress}
                      placeholder="Digite o CPF ou CNPJ"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={searchingDocument || !formData.document}
                      onClick={() => searchDocument(formData.document)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome/Razão Social</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fantasy_name">Nome Fantasia</Label>
                    <Input
                      id="fantasy_name"
                      name="fantasy_name"
                      value={formData.fantasy_name}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="state_registration">Inscrição Estadual</Label>
                    <Input
                      id="state_registration"
                      name="state_registration"
                      value={formData.state_registration}
                      onChange={handleInputChange}
                      disabled={formData.state_registration_exempt}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="state_registration_exempt"
                      checked={formData.state_registration_exempt}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          state_registration_exempt: checked as boolean,
                          state_registration: checked ? "" : prev.state_registration
                        }))
                      }
                    />
                    <Label htmlFor="state_registration_exempt">IE Isento</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipal_registration">Inscrição Municipal</Label>
                  <Input
                    id="municipal_registration"
                    name="municipal_registration"
                    value={formData.municipal_registration}
                    onChange={handleInputChange}
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">CEP</Label>
                    <IMaskInput
                      id="zip_code"
                      name="zip_code"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.zip_code}
                      mask="00000-000"
                      onAccept={(value) => handleCEPChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
                      placeholder="Digite o CEP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">UF</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      maxLength={2}
                      className="h-9"
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="h-9"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleInputChange}
                      className="h-9"
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="street">Logradouro</Label>
                    <Input
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      className="h-9"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street_number">Número</Label>
                    <Input
                      id="street_number"
                      name="street_number"
                      value={formData.street_number}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone_landline">Telefone Fixo</Label>
                    <IMaskInput
                      id="phone_landline"
                      name="phone_landline"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.phone_landline}
                      mask="(00) 0000-0000"
                      onAccept={(value) => setFormData(prev => ({ ...prev, phone_landline: value }))}
                      placeholder="Digite o telefone fixo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile_phone">Celular</Label>
                    <IMaskInput
                      id="mobile_phone"
                      name="mobile_phone"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.mobile_phone}
                      mask="(00) 00000-0000"
                      onAccept={(value) => setFormData(prev => ({ ...prev, mobile_phone: value }))}
                      placeholder="Digite o celular"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_carrier">Operadora</Label>
                    <Input
                      id="phone_carrier"
                      name="phone_carrier"
                      value={formData.phone_carrier}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nfe_email">Email NFe</Label>
                    <Input
                      id="nfe_email"
                      name="nfe_email"
                      type="email"
                      value={formData.nfe_email}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.withOrders
                ? "Este cliente possui ordens de serviço. Digite a senha de administrador para confirmar a exclusão do cliente e todas as suas ordens de serviço."
                : "Tem certeza que deseja excluir este cliente?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteDialog.withOrders && (
            <div className="space-y-2 py-4">
              <Label htmlFor="admin_password">Senha de Administrador</Label>
              <Input
                id="admin_password"
                type="password"
                value={deleteDialog.adminPassword}
                onChange={(e) => setDeleteDialog(prev => ({ ...prev, adminPassword: e.target.value }))}
                placeholder="Digite a senha de administrador"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
