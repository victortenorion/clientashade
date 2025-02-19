
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { NFSeServiceInfo } from "./NFSeServiceInfo";
import { NFSeHeaderInfo } from "./NFSeHeaderInfo";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export function NFSeEmissionForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [certificateStatus, setCertificateStatus] = useState<{
    valid: boolean;
    message: string;
  }>({ valid: false, message: "" });
  const [formData, setFormData] = useState({
    numero_rps: "",
    tipo_recolhimento: "A",
    codigo_servico: "",
    discriminacao_servicos: "",
    natureza_operacao: "1"
  });

  useEffect(() => {
    checkCertificateStatus();
  }, []);

  const checkCertificateStatus = async () => {
    try {
      console.log("Verificando status do certificado...");
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('nfse_sp_settings')
        .select('certificates_id, is_active')
        .eq('is_active', true)
        .single();

      if (settingsError) {
        console.error('Erro ao buscar configurações:', settingsError);
        throw settingsError;
      }

      if (!settingsData || !settingsData.certificates_id) {
        setCertificateStatus({
          valid: false,
          message: "Nenhum certificado configurado nas configurações ativas"
        });
        return;
      }

      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .select('is_valid, valid_until')
        .eq('id', settingsData.certificates_id)
        .single();

      if (certError) {
        console.error('Erro ao buscar certificado:', certError);
        throw certError;
      }

      if (!certData) {
        setCertificateStatus({
          valid: false,
          message: "Certificado não encontrado"
        });
        return;
      }

      const isValid = certData.is_valid && new Date(certData.valid_until) > new Date();

      setCertificateStatus({
        valid: isValid,
        message: isValid 
          ? `Certificado válido até ${new Date(certData.valid_until).toLocaleDateString()}`
          : "Certificado inválido ou expirado"
      });

    } catch (error) {
      console.error('Erro ao verificar certificado:', error);
      setCertificateStatus({
        valid: false,
        message: "Erro ao verificar status do certificado"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!certificateStatus.valid) {
        throw new Error("Certificado digital inválido ou não encontrado");
      }

      // Validações dos campos obrigatórios
      if (!formData.codigo_servico || !formData.discriminacao_servicos || !formData.numero_rps) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const { data: settings } = await supabase
        .from('nfse_sp_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!settings) {
        throw new Error("Configurações da NFS-e não encontradas");
      }

      // Criar nova NFS-e
      const { data: nfse, error: nfseError } = await supabase
        .from('nfse')
        .insert([
          {
            numero_rps: formData.numero_rps,
            tipo_recolhimento: formData.tipo_recolhimento,
            codigo_servico: formData.codigo_servico,
            discriminacao_servicos: formData.discriminacao_servicos,
            natureza_operacao: formData.natureza_operacao,
            nfse_sp_settings_id: settings.id,
            status_sefaz: 'pendente',
            ambiente: settings.ambiente
          }
        ])
        .select()
        .single();

      if (nfseError) throw nfseError;

      // Adicionar à fila de transmissão
      await supabase
        .from('sefaz_transmission_queue')
        .insert([
          {
            tipo: 'nfse',
            documento_id: nfse.data.id,
            status: 'pendente'
          }
        ]);

      toast({
        title: "NFS-e criada com sucesso",
        description: "A nota fiscal será processada em breve"
      });

      navigate('/dashboard/nfse');
    } catch (error: any) {
      console.error('Erro ao emitir NFS-e:', error);
      toast({
        variant: "destructive",
        title: "Erro ao emitir NFS-e",
        description: error.message || "Ocorreu um erro ao processar sua solicitação"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerta de Status do Certificado */}
      <Alert variant={certificateStatus.valid ? "default" : "destructive"}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Status do Certificado Digital</AlertTitle>
        <AlertDescription>
          {certificateStatus.message}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Dados do RPS</CardTitle>
        </CardHeader>
        <CardContent>
          <NFSeHeaderInfo
            numeroRps={formData.numero_rps}
            tipoRecolhimento={formData.tipo_recolhimento}
            onNumeroRpsChange={(value) => setFormData({ ...formData, numero_rps: value })}
            onTipoRecolhimentoChange={(value) => setFormData({ ...formData, tipo_recolhimento: value })}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <NFSeServiceInfo
            codigoServico={formData.codigo_servico}
            discriminacaoServicos={formData.discriminacao_servicos}
            naturezaOperacao={formData.natureza_operacao}
            onCodigoServicoChange={(value) => setFormData({ ...formData, codigo_servico: value })}
            onDiscriminacaoServicosChange={(value) => setFormData({ ...formData, discriminacao_servicos: value })}
            onNaturezaOperacaoChange={(value) => setFormData({ ...formData, natureza_operacao: value })}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/dashboard/nfse')}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !certificateStatus.valid}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Emitir NFS-e'
          )}
        </Button>
      </div>
    </form>
  );
}
