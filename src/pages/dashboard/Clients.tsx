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
import { Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  client_login: string | null;
  client_password: string | null;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  document: string;
  client_login: string;
  client_password: string;
}

const defaultFormData: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  document: "",
  client_login: "",
  client_password: "",
};

const getLastFourDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
};

const Clients = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    name: true,
    email: true,
    phone: true,
    document: true,
    client_login: true,
  });
  const { toast } = useToast();

  const fetchVisibleFields = async () => {
    try {
      const { data, error } = await supabase
        .from("client_field_settings")
        .select("*");

      if (error) throw error;

      if (data) {
        const fields = data.reduce((acc, curr) => ({
          ...acc,
          [curr.field_name]: curr.visible
        }), visibleFields);
        
        setVisibleFields(fields);
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações dos campos:", error);
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

      setClients(data as Client[]);
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Cliente excluído com sucesso",
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
      email: client.email || "",
      phone: client.phone || "",
      document: client.document || "",
      client_login: client.client_login || client.email || "",
      client_password: "", // Não preenchemos a senha por segurança
    });
    setEditingId(client.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      
      // Se estiver editando e a senha estiver vazia, removemos do objeto para não sobrescrever
      if (editingId && !dataToSend.client_password) {
        delete dataToSend.client_password;
      }

      if (editingId) {
        const { error } = await supabase
          .from("clients")
          .update(dataToSend)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Cliente atualizado com sucesso",
        });
      } else {
        // Validar se o login já existe
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
          .insert(formData);

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

  useEffect(() => {
    fetchClients();
    fetchVisibleFields();
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
              {visibleFields.name && <TableHead>Nome</TableHead>}
              {visibleFields.email && <TableHead>Email</TableHead>}
              {visibleFields.phone && <TableHead>Telefone</TableHead>}
              {visibleFields.document && <TableHead>Documento</TableHead>}
              {visibleFields.client_login && <TableHead>Login do Cliente</TableHead>}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  {visibleFields.name && <TableCell>{client.name}</TableCell>}
                  {visibleFields.email && <TableCell>{client.email}</TableCell>}
                  {visibleFields.phone && <TableCell>{client.phone}</TableCell>}
                  {visibleFields.document && <TableCell>{client.document}</TableCell>}
                  {visibleFields.client_login && <TableCell>{client.client_login}</TableCell>}
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
                      onClick={() => handleDelete(client.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">Documento</Label>
              <Input
                id="document"
                name="document"
                value={formData.document}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_login">Login do Cliente</Label>
              <Input
                id="client_login"
                name="client_login"
                value={formData.client_login}
                onChange={handleInputChange}
                required
                placeholder="Preenchido automaticamente com o email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_password">Senha do Cliente</Label>
              <Input
                id="client_password"
                name="client_password"
                value={formData.client_password}
                onChange={handleInputChange}
                placeholder={editingId ? "(deixe em branco para manter a atual)" : "4 últimos dígitos do telefone"}
                {...(!editingId && { required: true })}
              />
            </div>
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
    </div>
  );
};

export default Clients;
