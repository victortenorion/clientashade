
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
  const { id: nfseId } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [initialData, setInitialData] = useState<NFSeFormData | null>(null);
  
  const serviceOrderId = searchParams.get('service_order_id');

  useEffect(() => {
    // Se não tiver ID da NFS-e nem da ordem de serviço, redireciona
    if (!nfseId && !serviceOrderId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados necessários não encontrados"
      });
      navigate('/dashboard/service-orders');
      return;
    }

    // Se tiver ID da NFS-e, carrega os dados para edição
    if (nfseId) {
      const loadNFSe = async () => {
        try {
          const { data: nfse, error } = await supabase
            .from('nfse')
            .select('*')
            .eq('id', nfseId)
            .single();

          if (error) throw error;
          if (!nfse) throw new Error('NFS-e não encontrada');

          // Verifica se a NFS-e pode ser editada
          if (nfse.status_sefaz === 'autorizada' || nfse.cancelada) {
            toast({
              variant: "destructive",
              title: "Erro",
              description: "Esta NFS-e não pode ser editada devido ao seu status atual"
            });
            navigate('/dashboard/nfse');
            return;
          }

          setInitialData({
            codigo_servico: nfse.codigo_servico,
            discriminacao_servicos: nfse.discriminacao_servicos,
            natureza_operacao: nfse.natureza_operacao,
            tipo_recolhimento: nfse.tipo_recolhimento,
            numero_rps: nfse.numero_rps,
          });
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Erro ao carregar NFS-e",
            description: error.message
          });
          navigate('/dashboard/nfse');
        }
      };

      loadNFSe();
    }
  }, [nfseId, serviceOrderId, navigate, toast]);

  const handleSubmit = async (data: NFSeFormData) => {
    setIsLoading(true);
    try {
      // Obter configurações da NFSe SP
      const { data: spSettings, error: settingsError } = await supabase
        .from('nfse_sp_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (settingsError) throw settingsError;
      if (!spSettings) throw new Error('Configurações da NFSe SP não encontradas');

      // Buscar a ordem de serviço
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

      const nfseData = {
        client_id: serviceOrder.client_id,
        service_order_id: serviceOrderId,
        valor_servicos: serviceOrder.total_price || 0,
        valor_total: serviceOrder.total_price || 0,
        data_competencia: new Date(),
        codigo_servico: data.codigo_servico,
        discriminacao_servicos: data.discriminacao_servicos,
        natureza_operacao: data.natureza_operacao || '1',
        tipo_recolhimento: data.tipo_recolhimento || 'A',
        numero_rps: data.numero_rps,
        serie_rps: '1',
        tipo_rps: 'RPS',
        base_calculo: serviceOrder.total_price || 0,
        status_sefaz: 'pendente',
        nfse_sp_settings_id: spSettings.id,
        tipo_documento: spSettings.tipo_documento || 'CNPJ',
        ambiente: spSettings.ambiente || 'homologacao',
        servico_discriminacao_item: data.discriminacao_servicos,
        operacao_tributacao: '1', // Valor padrão para tributação no município
        servico_exigibilidade: '1', // Valor padrão para exigível
      };

      if (nfseId) {
        // Atualiza NFS-e existente
        const { error: updateError } = await supabase
          .from('nfse')
          .update(nfseData)
          .eq('id', nfseId);

        if (updateError) throw updateError;

        toast({
          title: "NFS-e atualizada com sucesso",
          description: "Os dados da NFS-e foram atualizados"
        });
      } else {
        // Criar nova NFS-e
        const { data: nfse, error: nfseError } = await supabase
          .from('nfse')
          .insert([nfseData])
          .select()
          .single();

        if (nfseError) throw nfseError;

        toast({
          title: "NFS-e gerada com sucesso",
          description: `NFS-e criada com sucesso`
        });
      }

      navigate('/dashboard/nfse');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: nfseId ? "Erro ao atualizar NFS-e" : "Erro ao gerar NFS-e",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/nfse');
  };

  if (!initialData && nfseId) {
    return null; // ou um componente de loading
  }

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
        <h2 className="text-2xl font-bold">
          {nfseId ? "Editar NFS-e" : "Nova NFS-e"}
        </h2>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {nfseId ? "Editar NFS-e" : "Emitir NFS-e"}
            </DialogTitle>
          </DialogHeader>
          
          <NFSeFormComponent
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            initialData={initialData}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
