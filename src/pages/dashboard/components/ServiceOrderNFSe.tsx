
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
  const [formData, setFormData] = useState<NFSeFormData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServiceOrder = async () => {
      try {
        // Buscar dados da empresa primeiro
        const { data: companyInfo, error: companyError } = await supabase
          .from("company_info")
          .select("codigo_servico, serie_rps_padrao")
          .maybeSingle();

        if (companyError) throw companyError;

        // Buscar configurações específicas para São Paulo
        const { data: spSettings, error: spError } = await supabase
          .from("nfse_sp_settings")
          .select("*")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (spError) throw spError;

        // Buscar dados da ordem de serviço
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
          // Formatar a descrição dos serviços em uma única linha
          const servicesDescription = `OS #${typedServiceOrder.order_number} - ${typedServiceOrder.equipment || 'Equipamento não especificado'} - S/N: ${typedServiceOrder.equipment_serial_number || 'N/A'} - Serviços realizados: ${typedServiceOrder.items.map(item => item.description).join(', ')} - (Total: R$ ${typedServiceOrder.total_price.toFixed(2)})`;

          const nfseData: NFSeFormData = {
            client_id: typedServiceOrder.client.id,
            codigo_servico: companyInfo?.codigo_servico || "",
            discriminacao_servicos: servicesDescription,
            valor_servicos: typedServiceOrder.total_price,
            data_competencia: new Date().toISOString().split("T")[0],
            deducoes: 0,
            observacoes: `Ordem de Serviço #${typedServiceOrder.order_number}`,
            natureza_operacao: "1",
            serie_rps: companyInfo?.serie_rps_padrao || "1",
            // Campos específicos para São Paulo
            responsavel_retencao: "cliente",
            local_servico: "tomador",
            optante_mei: false,
            prestador_incentivador_cultural: false,
            tributacao_rps: "T",
            enviar_email_tomador: true,
            enviar_email_intermediario: false,
            intermediario_servico: false,
            tipo_servico: "prestado",
            aliquota_pis: 0,
            aliquota_cofins: 0,
            aliquota_csll: 0,
            outras_retencoes: 0,
            codigo_regime_especial_tributacao: spSettings?.tipo_regime_especial || null
          };

          setFormData(nfseData);
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

      // Create NFS-e record
      const { data: nfse, error: nfseError } = await supabase
        .from("nfse")
        .insert({
          ...data,
          service_order_id: serviceOrderId,
          status_sefaz: "pendente"
        })
        .select()
        .single();

      if (nfseError) throw nfseError;

      toast({
        title: "NFS-e salva com sucesso",
        description: "A nota fiscal foi salva e pode ser enviada posteriormente"
      });
      
      // Redirecionar para a lista de NFS-e
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

  if (isLoading || !formData) {
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
