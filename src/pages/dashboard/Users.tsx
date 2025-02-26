
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ColumnSelect } from "@/components/ui/column-select";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

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
                      ? user.email ?? "Não disponível"
                      : columnName.endsWith("_at")
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

