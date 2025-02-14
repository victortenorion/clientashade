
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { NFSeForm } from "./NFSeForm";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import type { NFSeFormData } from "../types/nfse.types";

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
        const { data: serviceOrder, error } = await supabase
          .from("service_orders")
          .select(`
            *,
            items:service_order_items(description, price),
            client:clients(id, codigo_servico)
          `)
          .eq("id", serviceOrderId)
          .single();

        if (error) throw error;

        if (serviceOrder) {
          const nfseData: NFSeFormData = {
            client_id: serviceOrder.client.id,
            codigo_servico: serviceOrder.client.codigo_servico || "", // Get the service code from client data
            discriminacao_servicos: serviceOrder.items
              .map((item: { description: string }) => item.description)
              .join("\n"),
            valor_servicos: serviceOrder.total_price,
            data_competencia: new Date().toISOString().split("T")[0],
            deducoes: 0,
            observacoes: `Ordem de Serviço #${serviceOrder.order_number}`
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
      const { error: nfseError } = await supabase
        .from("nfse")
        .insert({
          ...data,
          service_order_id: serviceOrderId,
          status_sefaz: "pendente"
        });

      if (nfseError) throw nfseError;

      toast({
        title: "NFS-e emitida com sucesso"
      });
      onSubmit();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao emitir NFS-e",
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
    <NFSeForm
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      initialData={formData}
    />
  );
};
