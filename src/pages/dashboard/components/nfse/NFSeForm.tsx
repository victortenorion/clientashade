
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NFSeFormData } from "../../types/nfse.types";
import { NFSeHeaderInfo } from "./NFSeHeaderInfo";
import { NFSeServiceInfo } from "./NFSeServiceInfo";

interface NFSeFormProps {
  onSubmit: (data: NFSeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: NFSeFormData | null;
}

export function NFSeForm({ onSubmit, onCancel, isLoading, initialData }: NFSeFormProps) {
  const [formData, setFormData] = useState<NFSeFormData>({
    codigo_servico: initialData?.codigo_servico || "",
    discriminacao_servicos: initialData?.discriminacao_servicos || "",
    natureza_operacao: initialData?.natureza_operacao || "1",
    tipo_recolhimento: initialData?.tipo_recolhimento || "A",
    numero_rps: initialData?.numero_rps || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <NFSeHeaderInfo
        numeroRps={formData.numero_rps}
        tipoRecolhimento={formData.tipo_recolhimento}
        onNumeroRpsChange={(value) => setFormData({ ...formData, numero_rps: value })}
        onTipoRecolhimentoChange={(value) => setFormData({ ...formData, tipo_recolhimento: value })}
        disabled={isLoading}
      />

      <NFSeServiceInfo
        codigoServico={formData.codigo_servico}
        discriminacaoServicos={formData.discriminacao_servicos}
        naturezaOperacao={formData.natureza_operacao}
        onCodigoServicoChange={(value) => setFormData({ ...formData, codigo_servico: value })}
        onDiscriminacaoServicosChange={(value) => setFormData({ ...formData, discriminacao_servicos: value })}
        onNaturezaOperacaoChange={(value) => setFormData({ ...formData, natureza_operacao: value })}
        disabled={isLoading}
      />

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : initialData ? "Salvar alterações" : "Gerar NFS-e"}
        </Button>
      </div>
    </form>
  );
}
