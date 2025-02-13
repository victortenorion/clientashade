
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
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  username: string | null;
  created_at: string;
  updated_at: string;
  permissions?: string[];
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  permissions: string[];
}

const defaultFormData: UserFormData = {
  username: "",
  email: "",
  password: "",
  permissions: [],
};

const menuOptions = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'clients', label: 'Clientes' },
  { value: 'users', label: 'Usuários' },
  { value: 'products', label: 'Produtos' },
  { value: 'stores', label: 'Lojas' },
  { value: 'service_orders', label: 'Ordens de Serviço' },
  { value: 'service_order_settings', label: 'Configurações de O.S.' },
  { value: 'customer_area', label: 'Área do Cliente' },
];

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${searchTerm}%`);

      if (profilesError) throw profilesError;

      // Buscar permissões para cada usuário
      const usersWithPermissions = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: permissionsData } = await supabase
            .from("user_permissions")
            .select("menu_permission")
            .eq("user_id", profile.id);

          return {
            ...profile,
            permissions: permissionsData?.map(p => p.menu_permission) || [],
          };
        })
      );

      setUsers(usersWithPermissions);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
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
      // Primeiro deletar as permissões
      const { error: permissionsError } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", id);

      if (permissionsError) throw permissionsError;

      // Depois deletar o perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (profileError) throw profileError;

      toast({
        title: "Usuário excluído com sucesso",
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message,
      });
    }
  };

  const handleEdit = async (user: User) => {
    const { data: permissions } = await supabase
      .from("user_permissions")
      .select("menu_permission")
      .eq("user_id", user.id);

    setFormData({
      username: user.username || "",
      email: "",
      password: "",
      permissions: permissions?.map(p => p.menu_permission) || [],
    });
    setEditingId(user.id);
    setDialogOpen(true);
  };

  const handleNewUser = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Atualizar usuário existente
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username: formData.username })
          .eq("id", editingId);

        if (profileError) throw profileError;

        // Atualizar permissões
        // Primeiro deletar todas as permissões existentes
        await supabase
          .from("user_permissions")
          .delete()
          .eq("user_id", editingId);

        // Depois inserir as novas permissões
        if (formData.permissions.length > 0) {
          const { error: permissionsError } = await supabase
            .from("user_permissions")
            .insert(
              formData.permissions.map(permission => ({
                user_id: editingId,
                menu_permission: permission,
              }))
            );

          if (permissionsError) throw permissionsError;
        }

        toast({
          title: "Usuário atualizado com sucesso",
        });
      } else {
        // Criar novo usuário
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user && formData.permissions.length > 0) {
          // Inserir permissões para o novo usuário
          const { error: permissionsError } = await supabase
            .from("user_permissions")
            .insert(
              formData.permissions.map(permission => ({
                user_id: authData.user!.id,
                menu_permission: permission,
              }))
            );

          if (permissionsError) throw permissionsError;
        }

        toast({
          title: "Usuário criado com sucesso",
          description: "Um email de confirmação foi enviado.",
        });
      }

      setDialogOpen(false);
      setFormData(defaultFormData);
      setEditingId(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingId ? "Erro ao atualizar usuário" : "Erro ao criar usuário",
        description: error.message,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission),
    }));
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Usuários</h2>
        <Button onClick={handleNewUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Buscar usuários..."
          className="max-w-sm"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Menus de Acesso</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Atualizado em</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions?.map(permission => (
                        <span
                          key={permission}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                        >
                          {menuOptions.find(opt => opt.value === permission)?.label || permission}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {new Date(user.updated_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
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
              {editingId ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {!editingId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Menus de Acesso</Label>
              <div className="grid grid-cols-2 gap-2">
                {menuOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={formData.permissions.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={option.value}>{option.label}</Label>
                  </div>
                ))}
              </div>
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

export default Users;
