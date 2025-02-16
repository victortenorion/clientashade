
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { NFCeForm as NFCeFormComponent } from "./components/NFCeForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NFCeFormData } from "./types/nfce.types";

export default function NFCeForm() {
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

  const handleSubmit = async (data: NFCeFormData) => {
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

      // Criar NFC-e
      const { data: nfce, error: nfceError } = await supabase
        .from('nfce')
        .insert([{
          client_id: serviceOrder.client_id,
          service_order_id: serviceOrderId,
          valor_produtos: serviceOrder.total_price,
          valor_total: serviceOrder.total_price,
          forma_pagamento: data.forma_pagamento,
          data_saida: data.data_saida || null,
        }])
        .select()
        .single();

      if (nfceError) throw nfceError;

      // Criar itens da NFC-e
      const nfceItems = data.items.map(item => ({
        nfce_id: nfce.id,
        product_id: item.product_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.quantidade * item.valor_unitario - (item.valor_desconto || 0),
        valor_desconto: item.valor_desconto || 0,
        ncm: item.ncm,
        cfop: item.cfop,
        unidade: item.unidade
      }));

      const { error: itemsError } = await supabase
        .from('nfce_items')
        .insert(nfceItems);

      if (itemsError) throw itemsError;

      toast({
        title: "NFC-e gerada com sucesso",
        description: `NFC-e número ${nfce.numero_nfce} criada`
      });

      navigate('/dashboard/nfce');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar NFC-e",
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
        <h2 className="text-2xl font-bold">Nova NFC-e</h2>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Emitir NFC-e</DialogTitle>
          </DialogHeader>
          
          <NFCeFormComponent
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
