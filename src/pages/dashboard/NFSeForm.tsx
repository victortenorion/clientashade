import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
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
      // Primeiro, verificar o número inicial configurado
      const { data: spConfig, error: configError } = await supabase
        .from('nfse_sp_config')
        .select('numero_inicial_nfse')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      // Verificar se já existem NFSe com número maior
      const { data: lastNFSe, error: nfseError } = await supabase
        .from('nfse')
        .select('numero_nfse')
        .order('numero_nfse', { ascending: false })
        .limit(1)
        .single();

      if (nfseError && nfseError.code !== 'PGRST116') {
        throw nfseError;
      }

      const numeroInicial = spConfig?.numero_inicial_nfse ? parseInt(spConfig.numero_inicial_nfse) : 1;
      const ultimoNumero = lastNFSe?.numero_nfse || 0;

      // Se o último número for menor que o número inicial configurado
      if (ultimoNumero < numeroInicial) {
        const confirmStart = window.confirm(
          `A numeração das NFS-e iniciará em ${numeroInicial} conforme configurado em Dados da Empresa. Deseja continuar?`
        );

        if (!confirmStart) {
          setIsLoading(false);
          return;
        }
      }

      if (nfseId) {
        // Atualiza NFS-e existente
        const { error: updateError } = await supabase
          .from('nfse')
          .update({
            codigo_servico: data.codigo_servico,
            discriminacao_servicos: data.discriminacao_servicos,
            natureza_operacao: data.natureza_operacao,
            tipo_recolhimento: data.tipo_recolhimento,
            numero_rps: data.numero_rps,
            updated_at: new Date().toISOString()
          })
          .eq('id', nfseId);

        if (updateError) throw updateError;

        toast({
          title: "NFS-e atualizada com sucesso",
          description: "Os dados da NFS-e foram atualizados"
        });
      } else {
        // Criar nova NFS-e
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

        // Criar nova NFS-e
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
            numero_nfse: numeroInicial > ultimoNumero ? numeroInicial : (ultimoNumero + 1)
          }])
          .select()
          .single();

        if (nfseError) throw nfseError;

        toast({
          title: "NFS-e gerada com sucesso",
          description: `NFS-e número ${nfse.numero_nfse} criada`
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
