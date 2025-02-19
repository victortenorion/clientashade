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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Client {
  id: string;
  name: string;
  document: string;
}

export function NFSeEmissionForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [certificateStatus, setCertificateStatus] = useState<{
    valid: boolean;
    message: string;
  }>({ valid: false, message: "" });
  const [formData, setFormData] = useState({
    client_id: "",
    numero_rps: "",
    tipo_recolhimento: "A",
    codigo_servico: "",
    discriminacao_servicos: "",
    natureza_operacao: "1",
    valor_servicos_rps: 0,
    valor_deducoes_rps: 0,
    aliquota_iss: 0
  });

  useEffect(() => {
    checkCertificateStatus();
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, document')
        .eq('excluida', false);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes."
      });
    }
  };

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

      if (!formData.client_id) {
        throw new Error("Selecione um cliente");
      }

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

      const { data: nfse, error: nfseError } = await supabase
        .from('nfse')
        .insert([
          {
            client_id: formData.client_id,
            numero_rps: formData.numero_rps,
            tipo_recolhimento: formData.tipo_recolhimento,
            codigo_servico: formData.codigo_servico,
            discriminacao_servicos: formData.discriminacao_servicos,
            natureza_operacao: formData.natureza_operacao,
            nfse_sp_settings_id: settings.id,
            status_sefaz: 'pendente',
            ambiente: settings.ambiente,
            valor_servicos_rps: formData.valor_servicos_rps,
            valor_deducoes_rps: formData.valor_deducoes_rps,
            aliquota_iss: formData.aliquota_iss
          }
        ])
        .select()
        .single();

      if (nfseError) throw nfseError;

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
      <Alert variant={certificateStatus.valid ? "default" : "destructive"}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Status do Certificado Digital</AlertTitle>
        <AlertDescription>
          {certificateStatus.message}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Seleção do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger id="client_id">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.document}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Valores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="valor_servicos_rps">Valor dos Serviços</Label>
              <Input
                id="valor_servicos_rps"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_servicos_rps}
                onChange={(e) => setFormData({ ...formData, valor_servicos_rps: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_deducoes_rps">Valor das Deduções</Label>
              <Input
                id="valor_deducoes_rps"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_deducoes_rps}
                onChange={(e) => setFormData({ ...formData, valor_deducoes_rps: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aliquota_iss">Alíquota ISS (%)</Label>
              <Input
                id="aliquota_iss"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.aliquota_iss}
                onChange={(e) => setFormData({ ...formData, aliquota_iss: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
                required
              />
            </div>
          </div>
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
