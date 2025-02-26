
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  username: string;
  updated_at: string;
  last_sign_in_at: string;
  [key: string]: any;
}

interface UserTableProps {
  users: User[];
  visibleColumns: string[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  isLoading: boolean;
}

export function UserTable({ users, visibleColumns, onEdit, onDelete, isLoading }: UserTableProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "Não disponível";
    return format(new Date(date), "dd/MM/yyyy HH:mm");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {visibleColumns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users?.map((user) => (
          <TableRow key={user.id}>
            {visibleColumns.map((columnName) => (
              <TableCell key={columnName}>
                {columnName.endsWith("_at")
                  ? formatDate(user[columnName])
                  : user[columnName] ?? "Não disponível"}
              </TableCell>
            ))}
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(user)}
                >
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600"
                  onClick={() => onDelete(user.id)}
                >
                  Excluir
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
