
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { NFSeForm as NFSeFormComponent } from "./components/NFSeForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NFSeFormData } from "./types/nfse.types";

export default function NFSeForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(true);
  
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

  const handleSubmit = async (data: NFSeFormData) => {
    setIsLoading(true);
    try {
      // Primeiro, busca os dados completos da ordem de serviço
      const { data: serviceOrder, error: serviceOrderError } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:client_id (*)
        `)
        .eq('id', serviceOrderId)
        .single();

      if (serviceOrderError) throw serviceOrderError;
      if (!serviceOrder) throw new Error('Ordem de serviço não encontrada');

      // Criar NFS-e
      const { data: nfse, error: nfseError } = await supabase
        .from('nfse')
        .insert([{
          client_id: serviceOrder.client_id,
          service_order_id: serviceOrderId,
          valor_servicos: serviceOrder.total_price,
          valor_total: serviceOrder.total_price,
          data_competencia: new Date(),
          codigo_servico: serviceOrder.codigo_servico || data.codigo_servico,
          discriminacao_servicos: serviceOrder.discriminacao_servico || data.discriminacao_servicos,
          iss_retido: serviceOrder.iss_retido || false,
          natureza_operacao: data.natureza_operacao,
          tipo_recolhimento: data.tipo_recolhimento,
          status_sefaz: 'pendente',
          tipo_rps: 'RPS',
          serie_rps: '1',
          numero_rps: data.numero_rps,
        }])
        .select()
        .single();

      if (nfseError) throw nfseError;

      toast({
        title: "NFS-e gerada com sucesso",
        description: `NFS-e número ${nfse.numero_nfse} criada`
      });

      navigate('/dashboard/nfse');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar NFS-e",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/service-orders');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Nova NFS-e</h2>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Emitir NFS-e</DialogTitle>
          </DialogHeader>
          
          <NFSeFormComponent
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
