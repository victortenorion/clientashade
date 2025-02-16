
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { FilterState } from "./types";

interface ServiceCodesFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function ServiceCodesFilters({ filters, onFilterChange }: ServiceCodesFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar códigos..."
          value={filters.searchTerm}
          onChange={(e) =>
            onFilterChange({ ...filters, searchTerm: e.target.value })
          }
          className="pl-8"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value: 'all' | 'active' | 'inactive') =>
            onFilterChange({ ...filters, status: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Alíquota ISS Mínima</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="Min %"
          value={filters.aliquotaRange.min}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              aliquotaRange: {
                ...filters.aliquotaRange,
                min: e.target.value ? Number(e.target.value) : '',
              },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Alíquota ISS Máxima</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="Max %"
          value={filters.aliquotaRange.max}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              aliquotaRange: {
                ...filters.aliquotaRange,
                max: e.target.value ? Number(e.target.value) : '',
              },
            })
          }
        />
      </div>
    </div>
  );
}
