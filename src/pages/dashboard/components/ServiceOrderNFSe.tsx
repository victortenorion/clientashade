
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface Props {
  serviceOrderId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

interface NFSeFormData {
  client_id: string;
  discriminacao_servicos: string;
  codigo_servico: string;
  valor_servicos: number;
  data_competencia: string;
  deducoes: number;
  observacoes: string;
}

export const ServiceOrderNFSe = ({ serviceOrderId, onSubmit, onCancel }: Props) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<NFSeFormData>({
    client_id: "",
    discriminacao_servicos: "",
    codigo_servico: "",
    valor_servicos: 0,
    data_competencia: format(new Date(), "yyyy-MM-dd"),
    deducoes: 0,
    observacoes: "",
  });

  const { data: serviceOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["service-order", serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select(`
          id,
          client_id,
          total_price,
          equipment,
          equipment_serial_number,
          service_order_items (
            description,
            price
          ),
          client:clients (
            id,
            name,
            document,
            state_registration,
            municipal_registration,
            zip_code,
            state,
            city,
            neighborhood,
            street,
            street_number,
            complement,
            phone,
            mobile_phone,
            email
          )
        `)
        .eq("id", serviceOrderId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: fiscalConfig } = useQuery({
    queryKey: ["fiscal_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fiscal_config")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Atualiza o formulário quando os dados da ordem de serviço são carregados
  if (serviceOrder && formData.client_id !== serviceOrder.client_id) {
    const itensFormatados = serviceOrder.service_order_items?.map(item => item.description).join(" - ") || "";
    const discriminacaoServicos = `Equipamento: ${serviceOrder.equipment || 'N/A'} NS: ${serviceOrder.equipment_serial_number || 'N/A'} - ${itensFormatados} - Valor Total dos Serviços: R$ ${serviceOrder.total_price.toFixed(2)}`;

    setFormData(prev => ({
      ...prev,
      client_id: serviceOrder.client_id,
      discriminacao_servicos: discriminacaoServicos,
      valor_servicos: serviceOrder.total_price,
      codigo_servico: fiscalConfig?.service_code || "",
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("nfse")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "NFS-e emitida com sucesso",
      });
      onSubmit();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao emitir NFS-e",
        description: error.message,
      });
    }
  };

  if (isLoadingOrder) {
    return <div>Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Emissão de NFS-e</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Razão Social</Label>
            <Input 
              value={serviceOrder?.client?.name || ""} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input 
              value={serviceOrder?.client?.document || ""} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input 
                value={serviceOrder?.client?.state_registration || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Municipal</Label>
              <Input 
                value={serviceOrder?.client?.municipal_registration || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input 
                value={serviceOrder?.client?.zip_code || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input 
                value={serviceOrder?.client?.state || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Município</Label>
              <Input 
                value={serviceOrder?.client?.city || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input 
                value={serviceOrder?.client?.neighborhood || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Logradouro</Label>
              <Input 
                value={serviceOrder?.client?.street || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número</Label>
              <Input 
                value={serviceOrder?.client?.street_number || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input 
                value={serviceOrder?.client?.complement || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                value={serviceOrder?.client?.phone || serviceOrder?.client?.mobile_phone || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input 
                value={serviceOrder?.client?.email || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código do Serviço</Label>
              <Input
                value={formData.codigo_servico}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>CNAE</Label>
              <Input
                value={fiscalConfig?.cnae || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discriminacao_servicos">Discriminação dos Serviços</Label>
            <Textarea
              id="discriminacao_servicos"
              value={formData.discriminacao_servicos}
              onChange={(e) =>
                setFormData(prev => ({ 
                  ...prev, 
                  discriminacao_servicos: e.target.value 
                }))
              }
              className="min-h-[200px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_servicos">Valor dos Serviços</Label>
              <Input
                id="valor_servicos"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_servicos}
                onChange={(e) =>
                  setFormData(prev => ({ 
                    ...prev, 
                    valor_servicos: parseFloat(e.target.value) 
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deducoes">Deduções</Label>
              <Input
                id="deducoes"
                type="number"
                step="0.01"
                min="0"
                value={formData.deducoes}
                onChange={(e) =>
                  setFormData(prev => ({ 
                    ...prev, 
                    deducoes: parseFloat(e.target.value) 
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_competencia">Data de Competência</Label>
            <Input
              id="data_competencia"
              type="date"
              value={formData.data_competencia}
              onChange={(e) =>
                setFormData(prev => ({ 
                  ...prev, 
                  data_competencia: e.target.value 
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData(prev => ({ 
                  ...prev, 
                  observacoes: e.target.value 
                }))
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit">
            Emitir NFS-e
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
