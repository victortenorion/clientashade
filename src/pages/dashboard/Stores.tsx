import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ColumnSelect } from "@/components/ui/column-select";

const STORE_COLUMNS = [
  { name: "name", label: "Nome" },
  { name: "documento", label: "CNPJ" },
  { name: "inscricao_municipal", label: "Inscrição Municipal" },
  { name: "codigo_municipio", label: "Código Município" },
  { name: "regime_tributario", label: "Regime Tributário" },
  { name: "aliquota_iss", label: "Alíquota ISS" },
];

export default function Stores() {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "documento",
    "inscricao_municipal",
    "codigo_municipio",
    "regime_tributario",
    "aliquota_iss",
  ]);

  const { data: stores, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lojas</h2>
        <div className="flex items-center gap-2">
          <ColumnSelect
            columns={STORE_COLUMNS}
            selectedColumns={visibleColumns}
            onChange={setVisibleColumns}
          />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Loja
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
              {STORE_COLUMNS
                .filter(col => visibleColumns.includes(col.name))
                .map((column) => (
                  <TableHead key={column.name}>{column.label}</TableHead>
                ))}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores?.map((store) => (
              <TableRow key={store.id}>
                {visibleColumns.map((columnName) => (
                  <TableCell key={columnName}>
                    {columnName === "aliquota_iss" 
                      ? `${store[columnName]}%`
                      : store[columnName]}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {}}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {}}
                      title="Excluir"
                    >
                      <Trash className="h-4 w-4" />
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
