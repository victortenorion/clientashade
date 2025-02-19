
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NFSeHeaderInfoProps {
  numeroRps: string;
  tipoRecolhimento: string;
  onNumeroRpsChange: (value: string) => void;
  onTipoRecolhimentoChange: (value: string) => void;
  disabled?: boolean;
}

export function NFSeHeaderInfo({
  numeroRps,
  tipoRecolhimento,
  onNumeroRpsChange,
  onTipoRecolhimentoChange,
  disabled
}: NFSeHeaderInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="numero_rps">Número do RPS</Label>
        <Input
          id="numero_rps"
          value={numeroRps}
          onChange={(e) => onNumeroRpsChange(e.target.value)}
          placeholder="Número do RPS"
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo_recolhimento">Tipo de Recolhimento</Label>
        <Select
          value={tipoRecolhimento}
          onValueChange={onTipoRecolhimentoChange}
          disabled={disabled}
        >
          <SelectTrigger id="tipo_recolhimento">
            <SelectValue placeholder="Selecione o tipo de recolhimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A recolher</SelectItem>
            <SelectItem value="R">Retido na fonte</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
