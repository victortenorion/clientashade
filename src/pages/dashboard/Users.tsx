
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnSelect } from "@/components/ui/column-select";
import { UserTable } from "./components/users/UserTable";
import { UserFormDialog } from "./components/users/UserFormDialog";
import { DeleteUserDialog } from "./components/users/DeleteUserDialog";
import { useUsers, UserFormData } from "./hooks/useUsers";

const USER_COLUMNS = [
  { name: "username", label: "Nome" },
  { name: "email", label: "E-mail" },
  { name: "updated_at", label: "Data Atualização" },
  { name: "last_sign_in_at", label: "Último Acesso" },
];

export default function Users() {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "username",
    "email",
    "updated_at",
    "last_sign_in_at",
  ]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);

  const {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers();

  const handleColumnsChange = async (columns: string[]) => {
    setVisibleColumns(columns);
  };

  const handleCreateUser = async (userData: UserFormData) => {
    const success = await createUser(userData);
    if (success) {
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateUser = async (userData: UserFormData) => {
    if (!selectedUserId) return;
    const success = await updateUser(selectedUserId, userData);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedUserId(null);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    const success = await deleteUser(selectedUserId);
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUserId(user.id);
    setSelectedUser({
      email: user.email || "",
      password: "",
      username: user.username || "",
    });
    setIsEditDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-red-500">Erro ao carregar usuários: {(error as Error).message}</p>
      </div>
    );
  }

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

      <UserTable
        users={users}
        visibleColumns={visibleColumns}
        onEdit={handleEdit}
        onDelete={(userId) => {
          setSelectedUserId(userId);
          setIsDeleteDialogOpen(true);
        }}
        isLoading={isLoading}
      />

      <UserFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUser}
        title="Criar Novo Usuário"
        submitLabel="Criar Usuário"
        showPassword={true}
      />

      <UserFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateUser}
        title="Editar Usuário"
        submitLabel="Salvar Alterações"
        initialData={selectedUser || undefined}
        showPassword={false}
      />

      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
