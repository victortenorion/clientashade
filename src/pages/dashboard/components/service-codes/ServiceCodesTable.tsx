
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { ServiceCode, SortField } from "./types";

interface ServiceCodesTableProps {
  isLoading: boolean;
  codes: ServiceCode[];
  sortField: SortField;
  onSort: (field: SortField) => void;
  onEdit: (code: ServiceCode) => void;
  onDelete: (code: ServiceCode) => void;
}

export function ServiceCodesTable({
  isLoading,
  codes,
  sortField,
  onSort,
  onEdit,
  onDelete,
}: ServiceCodesTableProps) {
  const renderSortIcon = (field: SortField) => {
    return (
      <ArrowUpDown 
        className={`h-4 w-4 inline ml-1 ${sortField === field ? 'opacity-100' : 'opacity-50'}`}
      />
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[100px] cursor-pointer"
              onClick={() => onSort('code')}
            >
              Código {renderSortIcon('code')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('description')}
            >
              Descrição {renderSortIcon('description')}
            </TableHead>
            <TableHead 
              className="w-[120px] text-right cursor-pointer"
              onClick={() => onSort('aliquota_iss')}
            >
              Alíquota ISS {renderSortIcon('aliquota_iss')}
            </TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          ) : codes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                Nenhum código de serviço encontrado
              </TableCell>
            </TableRow>
          ) : (
            codes.map((code) => (
              <TableRow key={code.id}>
                <TableCell className="font-medium">{code.code}</TableCell>
                <TableCell>{code.description}</TableCell>
                <TableCell className="text-right">
                  {code.aliquota_iss?.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(code)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(code)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
