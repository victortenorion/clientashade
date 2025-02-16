
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export default function NFCeForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const serviceOrderId = searchParams.get('service_order_id');

  useEffect(() => {
    if (!serviceOrderId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ordem de serviço não encontrada"
      });
      navigate('/dashboard/service-orders');
    }
  }, [serviceOrderId, navigate, toast]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Nova NFC-e</h2>
      <p>Implementação em andamento...</p>
      <p>Ordem de Serviço ID: {serviceOrderId}</p>
    </div>
  );
}
