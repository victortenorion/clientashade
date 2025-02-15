
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { NFSeForm } from "./NFSeForm";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import type { NFSeFormData } from "../types/nfse.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServiceOrder {
  id: string;
  order_number: string;
  equipment: string | null;
  equipment_serial_number: string | null;
  total_price: number;
  items: ServiceOrderItem[];
  client: {
    id: string;
  };
}

interface ServiceOrderItem {
  description: string;
  price: number;
}

interface ServiceOrderNFSeProps {
  serviceOrderId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ServiceOrderNFSe: React.FC<ServiceOrderNFSeProps> = ({
  serviceOrderId,
  onSubmit,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<NFSeFormData>({
    client_id: "",
    codigo_servico: "",
    discriminacao_servicos: "",
    valor_servicos: 0,
    data_competencia: new Date().toISOString().split("T")[0],
    deducoes: 0,
    observacoes: "",
    natureza_operacao: "1",
    municipio_prestacao: "",
    cnae: "",
    retencao_ir: false,
    percentual_ir: 0,
    retencao_iss: false,
    desconto_iss: false,
    retencao_inss: false,
    retencao_pis_cofins_csll: false,
    percentual_tributos_ibpt: 0,
    desconto_incondicional: 0,
    vendedor_id: "",
    comissao_percentual: 0,
    numero_rps: "",
    serie_rps: "1",
    responsavel_retencao: "cliente",
    local_servico: "tomador",
    optante_mei: false,
    prestador_incentivador_cultural: false,
    tributacao_rps: "T",
    enviar_email_tomador: true,
    enviar_email_intermediario: false,
    intermediario_servico: false,
    aliquota_pis: 0,
    aliquota_cofins: 0,
    aliquota_csll: 0,
    outras_retencoes: 0,
    codigo_regime_especial_tributacao: null
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServiceOrder = async () => {
      try {
        const { data: companyInfo, error: companyError } = await supabase
          .from("company_info")
          .select("codigo_servico, serie_rps_padrao")
          .maybeSingle();

        if (companyError) throw companyError;

        const { data: spSettings, error: spError } = await supabase
          .from("nfse_sp_settings")
          .select("*")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: spConfig, error: spConfigError } = await supabase
          .from("nfse_sp_config")
          .select("numero_inicial_rps, ultima_rps_numero")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (spError) throw spError;
        if (spConfigError) throw spConfigError;

        const { data: serviceOrder, error } = await supabase
          .from("service_orders")
          .select(`
            id,
            order_number,
            equipment,
            equipment_serial_number,
            total_price,
            items:service_order_items(description, price),
            client:clients(id)
          `)
          .eq("id", serviceOrderId)
          .single();

        if (error) throw error;

        if (serviceOrder) {
          const typedServiceOrder = serviceOrder as unknown as ServiceOrder;
          const servicesDescription = `OS #${typedServiceOrder.order_number} - ${typedServiceOrder.equipment || 'Equipamento não especificado'} - S/N: ${typedServiceOrder.equipment_serial_number || 'N/A'} - Serviços realizados: ${typedServiceOrder.items.map(item => item.description).join(', ')} - (Total: R$ ${typedServiceOrder.total_price.toFixed(2)})`;

          let proximoNumeroRPS: string = "1";

          if (spConfig) {
            if (spConfig.numero_inicial_rps && spConfig.numero_inicial_rps > 0) {
              if (!spConfig.ultima_rps_numero || spConfig.ultima_rps_numero < spConfig.numero_inicial_rps) {
                proximoNumeroRPS = spConfig.numero_inicial_rps.toString();
              } else {
                proximoNumeroRPS = (spConfig.ultima_rps_numero + 1).toString();
              }
            } else {
              proximoNumeroRPS = ((spConfig.ultima_rps_numero || 0) + 1).toString();
            }
          }

          setFormData(prevData => ({
            ...prevData,
            client_id: typedServiceOrder.client.id,
            codigo_servico: companyInfo?.codigo_servico || "",
            discriminacao_servicos: servicesDescription,
            valor_servicos: typedServiceOrder.total_price,
            observacoes: `Ordem de Serviço #${typedServiceOrder.order_number}`,
            serie_rps: companyInfo?.serie_rps_padrao || "1",
            numero_rps: proximoNumeroRPS,
            codigo_regime_especial_tributacao: spSettings?.tipo_regime_especial || null
          }));
        }
      } catch (error: any) {
        console.error("Error fetching service order:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar ordem de serviço",
          description: error.message
        });
        navigate("/dashboard/service-orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceOrder();
  }, [serviceOrderId, toast, navigate]);

  const handleSubmit = async (data: NFSeFormData) => {
    try {
      setIsLoading(true);

      const { data: nfse, error: nfseError } = await supabase
        .from("nfse")
        .insert({
          ...data,
          service_order_id: serviceOrderId,
          status_sefaz: "pendente",
          status_transmissao: "pendente"
        })
        .select()
        .single();

      if (nfseError) throw nfseError;

      const { error: updateError } = await supabase
        .from("nfse_sp_config")
        .update({ 
          ultima_rps_numero: parseInt(data.numero_rps || "0", 10)
        })
        .eq('id', (await supabase.from('nfse_sp_config').select('id').single()).data.id);

      if (updateError) {
        console.error("Erro ao atualizar número do RPS:", updateError);
      }

      toast({
        title: "NFS-e salva com sucesso",
        description: "A nota fiscal foi salva e pode ser enviada posteriormente"
      });
      
      navigate("/dashboard/nfse");
    } catch (error: any) {
      console.error("Error saving NFSe:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar NFS-e",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova NFS-e</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <NFSeForm
          onSubmit={handleSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
          initialData={formData}
          submitButtonText="Salvar"
        />
      </CardContent>
    </Card>
  );
};
