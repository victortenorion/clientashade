
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NFSeSPTipoRecolhimento } from "../../types/nfse.types";

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
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="numero_rps">Número do RPS</Label>
        <Input
          id="numero_rps"
          value={numeroRps}
          onChange={(e) => onNumeroRpsChange(e.target.value)}
          disabled={disabled}
          placeholder="Digite o número do RPS"
        />
      </div>

      <div>
        <Label htmlFor="tipo_recolhimento">Tipo de Recolhimento</Label>
        <Select
          value={tipoRecolhimento}
          onValueChange={onTipoRecolhimentoChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de recolhimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NFSeSPTipoRecolhimento.A_RECOLHER}>
              A Recolher
            </SelectItem>
            <SelectItem value={NFSeSPTipoRecolhimento.RETIDO}>
              Retido
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
