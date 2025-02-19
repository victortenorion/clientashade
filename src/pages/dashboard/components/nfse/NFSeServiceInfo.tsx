
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NFSeSPNaturezaOperacao } from "../../types/nfse.types";

interface NFSeServiceInfoProps {
  codigoServico: string;
  discriminacaoServicos: string;
  naturezaOperacao: string;
  onCodigoServicoChange: (value: string) => void;
  onDiscriminacaoServicosChange: (value: string) => void;
  onNaturezaOperacaoChange: (value: string) => void;
  disabled?: boolean;
}

export function NFSeServiceInfo({
  codigoServico,
  discriminacaoServicos,
  naturezaOperacao,
  onCodigoServicoChange,
  onDiscriminacaoServicosChange,
  onNaturezaOperacaoChange,
  disabled
}: NFSeServiceInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="codigo_servico">Código do Serviço</Label>
        <Input
          id="codigo_servico"
          value={codigoServico}
          onChange={(e) => onCodigoServicoChange(e.target.value)}
          disabled={disabled}
          placeholder="Digite o código do serviço"
        />
      </div>

      <div>
        <Label htmlFor="discriminacao">Discriminação dos Serviços</Label>
        <Textarea
          id="discriminacao"
          value={discriminacaoServicos}
          onChange={(e) => onDiscriminacaoServicosChange(e.target.value)}
          disabled={disabled}
          placeholder="Descreva os serviços prestados"
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
        <Select
          value={naturezaOperacao}
          onValueChange={onNaturezaOperacaoChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a natureza da operação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NFSeSPNaturezaOperacao.TRIBUTACAO_MUNICIPIO}>
              Tributação no Município
            </SelectItem>
            <SelectItem value={NFSeSPNaturezaOperacao.TRIBUTACAO_FORA_MUNICIPIO}>
              Tributação fora do Município
            </SelectItem>
            <SelectItem value={NFSeSPNaturezaOperacao.ISENCAO}>
              Isenção
            </SelectItem>
            <SelectItem value={NFSeSPNaturezaOperacao.IMUNE}>
              Imune
            </SelectItem>
            <SelectItem value={NFSeSPNaturezaOperacao.EXIGIBILIDADE_SUSPENSA_DECISAO_JUDICIAL}>
              Exigibilidade Suspensa por Decisão Judicial
            </SelectItem>
            <SelectItem value={NFSeSPNaturezaOperacao.EXIGIBILIDADE_SUSPENSA_PROCEDIMENTO_ADMINISTRATIVO}>
              Exigibilidade Suspensa por Procedimento Administrativo
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
