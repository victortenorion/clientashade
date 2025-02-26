
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ColumnSelect } from "@/components/ui/column-select";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const USER_COLUMNS = [
  { name: "username", label: "Nome" },
  { name: "email", label: "E-mail" },
  { name: "updated_at", label: "Data Atualização" },
  { name: "last_sign_in_at", label: "Último Acesso" },
];

interface UserFormData {
  email: string;
  password: string;
  username: string;
}

export default function Users() {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "username",
    "email",
    "updated_at",
    "last_sign_in_at",
  ]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    password: "",
    username: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('user_field_settings')
          .select('visible_columns')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar preferências:', error);
          return;
        }

        if (data?.visible_columns) {
          setVisibleColumns(data.visible_columns);
        }
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    };

    loadUserPreferences();
  }, []);

  const handleColumnsChange = async (columns: string[]) => {
    try {
      setVisibleColumns(columns);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('user_field_settings')
        .upsert({
          user_id: session.user.id,
          visible_columns: columns,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Erro ao salvar preferências:', error);
        toast({
          variant: "destructive",
          title: "Erro ao salvar preferências",
          description: "Suas preferências não puderam ser salvas. Tente novamente."
        });
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar preferências",
        description: "Suas preferências não puderam ser salvas. Tente novamente."
      });
    }
  };

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          email,
          updated_at,
          last_sign_in_at
        `);

      console.log('Dados dos usuários:', data);

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }
      return data;
    },
  });

  const createUser = async (userData: UserFormData) => {
    try {
      // Criar usuário na auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;

      // O perfil será criado automaticamente pelo trigger
      toast({
        title: "Usuário criado com sucesso!",
        description: "Um e-mail de confirmação foi enviado.",
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      setFormData({ email: "", password: "", username: "" });
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário.",
      });
    }
  };

  const deleteUser = async () => {
    if (!selectedUserId) return;

    try {
      const { error } = await supabase
        .rpc('delete_user', { user_id: selectedUserId });

      if (error) throw error;

      toast({
        title: "Usuário excluído com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário.",
      });
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Não disponível";
    return format(new Date(date), "dd/MM/yyyy HH:mm");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Usuários</h2>
        <div className="flex items-center gap-2">
          <ColumnSelect
            columns={USER_COLUMNS}
            selectedColumns={visibleColumns}
            onChange={handleColumnsChange}
          />
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <span>Carregando...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {USER_COLUMNS
                .filter(col => visibleColumns.includes(col.name))
                .map((column) => (
                  <TableHead key={column.name}>{column.label}</TableHead>
                ))}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                {visibleColumns.map((columnName) => (
                  <TableCell key={columnName}>
                    {columnName === "email" 
                      ? user.email ?? "Não disponível"
                      : columnName.endsWith("_at")
                      ? formatDate(user[columnName])
                      : user[columnName] ?? "Não disponível"}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implementar edição
                        toast({
                          title: "Em desenvolvimento",
                          description: "A edição de usuários será implementada em breve.",
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog de Criação de Usuário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createUser(formData)}>
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir este usuário?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteUser}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
