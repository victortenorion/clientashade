import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Pencil, Trash2, Key } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
  store_id?: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  permissions: string[];
  store_id: string;
}

interface Requirement {
  regex: RegExp;
  text: string;
  met: boolean;
}

const menuOptions = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'clients', label: 'Clientes' },
  { value: 'users', label: 'Usuários' },
  { value: 'products', label: 'Produtos' },
  { value: 'stores', label: 'Lojas' },
  { value: 'service_orders', label: 'Ordens de Serviço' },
  { value: 'service_order_settings', label: 'Configurações de O.S.' },
  { value: 'customer_area', label: 'Área do Cliente' },
  { value: 'nfce', label: 'NFC-e' },
  { value: 'nfse', label: 'NFS-e' },
];

const defaultFormData: UserFormData = {
  username: "",
  email: "",
  password: "",
  permissions: [],
  store_id: "",
};

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasAllPermissions, setHasAllPermissions] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stores, setStores] = useState<{ id: string; name: string; }[]>([]);
  const { toast } = useToast();

  const [usernameRequirements, setUsernameRequirements] = useState<Requirement[]>([
    { regex: /.{3,}/, text: "Mínimo de 3 caracteres", met: false },
    { regex: /^[a-zA-Z0-9._-]+$/, text: "Apenas letras, números, ponto, traço e underscore", met: false },
  ]);

  const [emailRequirements, setEmailRequirements] = useState<Requirement[]>([
    { regex: /.+@.+\..+/, text: "Deve ser um email válido", met: false },
  ]);

  const [passwordRequirements, setPasswordRequirements] = useState<Requirement[]>([
    { regex: /.{6,}/, text: "Mínimo de 6 caracteres", met: false },
    { regex: /[A-Z]/, text: "Pelo menos uma letra maiúscula", met: false },
    { regex: /[a-z]/, text: "Pelo menos uma letra minúscula", met: false },
    { regex: /[0-9]/, text: "Pelo menos um número", met: false },
  ]);

  const checkUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc('user_has_all_permissions', {
          user_uuid: user.id
        });
        
        if (error) throw error;
        setHasAllPermissions(data);
      }
    } catch (error: any) {
      console.error("Erro ao verificar permissões:", error);
      setHasAllPermissions(false);
    }
  };

  const updateRequirements = (value: string, setRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>) => {
    setRequirements(prev =>
      prev.map(req => ({
        ...req,
        met: req.regex.test(value)
      }))
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    switch (name) {
      case 'username':
        updateRequirements(value, setUsernameRequirements);
        break;
      case 'email':
        updateRequirements(value, setEmailRequirements);
        break;
      case 'password':
        updateRequirements(value, setPasswordRequirements);
        break;
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name");

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar lojas:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar lojas",
        description: error.message,
      });
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${searchTerm}%`);

      if (profilesError) throw profilesError;

      if (!hasAllPermissions) {
        setUsers(profilesData || []);
        return;
      }

      const usersWithData = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const [permissionsData, storeData] = await Promise.all([
            supabase
              .from("user_permissions")
              .select("menu_permission")
              .eq("user_id", profile.id),
            supabase
              .from("user_stores")
              .select("store_id")
              .eq("user_id", profile.id)
              .single()
          ]);

          const permissions = permissionsData.data?.map(p => p.menu_permission) || [];
          const store_id = storeData.data?.store_id;

          return {
            ...profile,
            permissions,
            store_id
          };
        })
      );

      setUsers(usersWithData);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
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
    if (!hasAllPermissions) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para excluir usuários.",
      });
      return;
    }

    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

      if (authError) {
        const { error: apiError } = await supabase.functions.invoke('delete-user', {
          body: { userId: id }
        });
        
        if (apiError) throw apiError;
      }

      toast({
        title: "Usuário excluído com sucesso",
      });
      
      fetchUsers();
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message,
      });
    }
  };

  const handleEdit = async (user: User) => {
    if (!hasAllPermissions) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para editar usuários.",
      });
      return;
    }

    console.log("Editando usuário com permissões:", user.permissions);
    setFormData({
      username: user.username || "",
      email: "",
      password: "",
      permissions: user.permissions || [],
      store_id: user.store_id || "",
    });
    setEditingId(user.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAllPermissions) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para modificar usuários.",
      });
      return;
    }

    if (!formData.store_id) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar usuário",
        description: "Por favor, selecione uma loja.",
      });
      return;
    }

    if (!editingId) {
      const isUsernameValid = usernameRequirements.every(req => req.met);
      const isEmailValid = emailRequirements.every(req => req.met);
      const isPasswordValid = passwordRequirements.every(req => req.met);

      if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
        toast({
          variant: "destructive",
          title: "Campos inválidos",
          description: "Por favor, verifique os requisitos de todos os campos.",
        });
        return;
      }
    }

    try {
      if (editingId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username: formData.username })
          .eq("id", editingId);

        if (profileError) throw profileError;

        const { error: deletePermissionsError } = await supabase
          .from("user_permissions")
          .delete()
          .eq("user_id", editingId);

        if (deletePermissionsError) throw deletePermissionsError;

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

        const { error: deleteStoreError } = await supabase
          .from("user_stores")
          .delete()
          .eq("user_id", editingId);

        if (deleteStoreError) throw deleteStoreError;

        const { error: storeError } = await supabase
          .from("user_stores")
          .insert({
            user_id: editingId,
            store_id: formData.store_id,
          });

        if (storeError) throw storeError;

        toast({
          title: "Usuário atualizado com sucesso",
        });
      } else {
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

        if (authData.user) {
          if (formData.permissions.length > 0) {
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

          const { error: storeError } = await supabase
            .from("user_stores")
            .insert({
              user_id: authData.user.id,
              store_id: formData.store_id,
            });

          if (storeError) throw storeError;
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
      console.error("Erro ao salvar usuário:", error);
      toast({
        variant: "destructive",
        title: editingId ? "Erro ao atualizar usuário" : "Erro ao criar usuário",
        description: error.message,
      });
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (!hasAllPermissions) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para modificar permissões.",
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission),
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada com sucesso",
      });

      setChangePasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message,
      });
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  useEffect(() => {
    checkUserPermissions();
    fetchStores();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, hasAllPermissions]);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const RequirementsList = ({ requirements }: { requirements: Requirement[] }) => (
    <ul className="text-sm space-y-1">
      {requirements.map((req, index) => (
        <li 
          key={index}
          className={`flex items-center gap-2 ${
            req.met ? 'text-green-600' : 'text-gray-500'
          }`}
        >
          {req.met ? '✓' : '○'} {req.text}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Usuários</h2>
        {hasAllPermissions && (
          <Button onClick={() => {
            setEditingId(null);
            setFormData(defaultFormData);
            setDialogOpen(true);
          }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        )}
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
              {hasAllPermissions && <TableHead>Menus de Acesso</TableHead>}
              <TableHead>Criado em</TableHead>
              <TableHead>Atualizado em</TableHead>
              {hasAllPermissions && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={hasAllPermissions ? 5 : 4} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasAllPermissions ? 5 : 4} className="text-center">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  {hasAllPermissions && (
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
                  )}
                  <TableCell>
                    {new Date(user.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {new Date(user.updated_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {currentUserId === user.id && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setChangePasswordDialogOpen(true)}
                        title="Alterar senha"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    )}
                    {hasAllPermissions && (
                      <>
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
                      </>
                    )}
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
              {!editingId && <RequirementsList requirements={usernameRequirements} />}
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
                  <RequirementsList requirements={emailRequirements} />
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
                  <RequirementsList requirements={passwordRequirements} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="store_id">Loja *</Label>
              <select
                id="store_id"
                name="store_id"
                value={formData.store_id}
                onChange={(e) => handleInputChange(e)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecione uma loja</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {hasAllPermissions && (
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
            )}

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

      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => {
                setChangePasswordDialogOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                Alterar Senha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
