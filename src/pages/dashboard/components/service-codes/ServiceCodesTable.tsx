
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ServiceCode, SortField, PaginationState } from "./types";

interface ServiceCodesTableProps {
  isLoading: boolean;
  codes: ServiceCode[];
  sortField: SortField;
  onSort: (field: SortField) => void;
  onEdit: (code: ServiceCode) => void;
  onDelete: (code: ServiceCode) => void;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function ServiceCodesTable({
  isLoading,
  codes,
  sortField,
  onSort,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
  onPageSizeChange,
}: ServiceCodesTableProps) {
  const renderSortIcon = (field: SortField) => {
    return (
      <ArrowUpDown 
        className={`h-4 w-4 inline ml-1 ${sortField === field ? 'opacity-100' : 'opacity-50'}`}
      />
    );
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize + 1;
  const endIndex = Math.min(startIndex + pagination.pageSize - 1, pagination.total);

  return (
    <div className="space-y-4">
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

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <select
            className="border rounded p-1"
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span>
            Mostrando {startIndex} até {endIndex} de {pagination.total} registros
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {pagination.page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
