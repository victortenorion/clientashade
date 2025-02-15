
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnDef } from "@tanstack/react-table";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
}

export function DataTable<TData>({ columns, data, loading }: DataTableProps<TData>) {
  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id || column.accessorKey?.toString()}>
                {typeof column.header === "function"
                  ? column.header({})
                  : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell key={column.id || column.accessorKey?.toString()}>
                  {column.cell
                    ? column.cell({ row: { getValue: () => row[column.accessorKey as keyof TData], original: row } })
                    : row[column.accessorKey as keyof TData]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
