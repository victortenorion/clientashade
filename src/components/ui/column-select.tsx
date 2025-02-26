
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

interface ColumnSelectProps {
  columns: { name: string; label: string }[];
  selectedColumns: string[];
  onChange: (columns: string[]) => void;
}

export function ColumnSelect({
  columns,
  selectedColumns,
  onChange,
}: ColumnSelectProps) {
  const toggleColumn = (columnName: string) => {
    if (selectedColumns.includes(columnName)) {
      onChange(selectedColumns.filter((col) => col !== columnName));
    } else {
      onChange([...selectedColumns, columnName]);
    }
  };

  const selectAll = () => {
    onChange(columns.map((col) => col.name));
  };

  const unselectAll = () => {
    onChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          Colunas Visíveis
          <Check className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={selectAll}
            >
              Selecionar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={unselectAll}
            >
              Limpar
            </Button>
          </div>
          <div className="space-y-2">
            {columns.map((column) => (
              <div
                key={column.name}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={column.name}
                  checked={selectedColumns.includes(column.name)}
                  onCheckedChange={() => toggleColumn(column.name)}
                />
                <Label
                  htmlFor={column.name}
                  className={cn(
                    "text-sm font-normal",
                    !selectedColumns.includes(column.name) && "opacity-50"
                  )}
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
