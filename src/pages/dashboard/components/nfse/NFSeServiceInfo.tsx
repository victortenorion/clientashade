
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const [serviceCodes, setServiceCodes] = useState<Array<{
    code: string;
    description: string;
  }>>([]);

  useEffect(() => {
    loadServiceCodes();
  }, []);

  const loadServiceCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('nfse_service_codes')
        .select('code, description')
        .eq('active', true);

      if (error) throw error;
      setServiceCodes(data || []);
    } catch (error) {
      console.error('Erro ao carregar códigos de serviço:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo_servico">Código do Serviço</Label>
          <Select
            value={codigoServico}
            onValueChange={onCodigoServicoChange}
            disabled={disabled}
          >
            <SelectTrigger id="codigo_servico">
              <SelectValue placeholder="Selecione o código do serviço" />
            </SelectTrigger>
            <SelectContent>
              {serviceCodes.map((service) => (
                <SelectItem key={service.code} value={service.code}>
                  {service.code} - {service.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
          <Select
            value={naturezaOperacao}
            onValueChange={onNaturezaOperacaoChange}
            disabled={disabled}
          >
            <SelectTrigger id="natureza_operacao">
              <SelectValue placeholder="Selecione a natureza da operação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Tributação no município</SelectItem>
              <SelectItem value="2">Tributação fora do município</SelectItem>
              <SelectItem value="3">Isenção</SelectItem>
              <SelectItem value="4">Imune</SelectItem>
              <SelectItem value="5">Exigibilidade suspensa por decisão judicial</SelectItem>
              <SelectItem value="6">Exigibilidade suspensa por procedimento administrativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discriminacao_servicos">
          Discriminação dos Serviços
        </Label>
        <Textarea
          id="discriminacao_servicos"
          value={discriminacaoServicos}
          onChange={(e) => onDiscriminacaoServicosChange(e.target.value)}
          placeholder="Descreva detalhadamente os serviços prestados"
          className="min-h-[100px]"
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
}
