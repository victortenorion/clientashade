
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ColumnSelect } from "@/components/ui/column-select";
import { format } from "date-fns";

const USER_COLUMNS = [
  { name: "username", label: "Nome" },
  { name: "email", label: "E-mail" },
  { name: "created_at", label: "Data Cadastro" },
  { name: "last_sign_in", label: "Último Acesso" },
];

export default function Users() {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "username",
    "email",
    "created_at",
    "last_sign_in",
  ]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          created_at,
          auth_user:users (
            email,
            last_sign_in_at
          )
        `, { count: 'exact' });

      if (error) throw error;
      return data;
    },
  });

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
            onChange={setVisibleColumns}
          />
          <Button>
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
                      ? user.auth_user?.[0]?.email ?? "Não disponível"
                      : columnName === "last_sign_in"
                      ? formatDate(user.auth_user?.[0]?.last_sign_in_at)
                      : columnName === "created_at"
                      ? formatDate(user[columnName])
                      : user[columnName] ?? "Não disponível"}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
