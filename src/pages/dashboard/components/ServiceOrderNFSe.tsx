
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { NFSeForm } from "./NFSeForm";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import type { NFSeFormData } from "../types/nfse.types";
import { SEFAZTransmissionStatus } from "./SEFAZTransmissionStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [transmissionStatus, setTransmissionStatus] = useState<string>('pendente');
  const [transmissionError, setTransmissionError] = useState<string | null>(null);
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
            codigo_servico: serviceOrder.client.codigo_servico || "",
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
      setTransmissionStatus('processando');

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

      // Create transmission queue entry
      const { error: queueError } = await supabase
        .from("sefaz_transmission_queue")
        .insert({
          tipo: 'nfse',
          documento_id: nfse.id,
          status: 'pendente'
        });

      if (queueError) throw queueError;

      // Start SEFAZ transmission
      const { error: transmissionError } = await supabase.functions.invoke('process-nfse', {
        body: { nfseId: nfse.id }
      });

      if (transmissionError) {
        setTransmissionStatus('erro');
        setTransmissionError(transmissionError.message);
        throw transmissionError;
      }

      setTransmissionStatus('enviado');
      toast({
        title: "NFS-e emitida com sucesso",
        description: "O documento foi enviado para processamento na SEFAZ"
      });
      
      // Wait a moment to show the success status before redirecting
      setTimeout(onSubmit, 2000);
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
    <Card>
      <CardHeader>
        <CardTitle>Emitir NFS-e</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SEFAZTransmissionStatus 
          status={transmissionStatus}
          error={transmissionError}
        />
        <NFSeForm
          onSubmit={handleSubmit}
          onCancel={onCancel}
          isLoading={isLoading || transmissionStatus === 'processando'}
          initialData={formData}
        />
      </CardContent>
    </Card>
  );
};
