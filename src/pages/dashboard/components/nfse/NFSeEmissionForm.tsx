import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { NFSeServiceInfo } from "./NFSeServiceInfo";
import { NFSeHeaderInfo } from "./NFSeHeaderInfo";
import { NFSeTransmissionStatus } from "./NFSeTransmissionStatus";
import { Printer, FileText, Send, File, Loader2, Mail, Eye, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompanyData {
  razao_social: string;
  cnpj: string;
  inscricao_municipal: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento: string | null;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_cep: string;
  email: string;
}

interface SEFAZData {
  ambiente: string;
  regime_tributario: string;
  certificado_valido: boolean;
  certificado_validade?: string;
}

export function NFSeEmissionForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [sefazData, setSefazData] = useState<SEFAZData | null>(null);
  const [nfseId, setNfseId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [formData, setFormData] = useState({
    numero_rps: "",
    tipo_recolhimento: "A",
    codigo_servico: "",
    discriminacao_servicos: "",
    natureza_operacao: "1"
  });

  useEffect(() => {
    loadCompanyAndSefazData();
  }, []);

  const loadCompanyAndSefazData = async () => {
    try {
      const { data: companyInfo, error: companyError } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (companyError) throw companyError;
      setCompanyData(companyInfo);

      const { data: sefazConfig, error: sefazError } = await supabase
        .from('nfse_sp_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (sefazError) throw sefazError;
      setSefazData(sefazConfig);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Verifique se os dados da empresa e configurações SEFAZ estão cadastrados."
      });
    }
  };

  const handlePrint = async () => {
    try {
      if (!nfseId) return;
      
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('generate-nfse-pdf', {
        body: { nfseId }
      });

      if (error) throw error;

      const printFrame = document.createElement('iframe');
      printFrame.style.display = 'none';
      document.body.appendChild(printFrame);
      
      printFrame.src = data.pdf;
      
      printFrame.onload = () => {
        try {
          printFrame.contentWindow?.print();
        } catch (e) {
          console.error('Erro ao imprimir:', e);
        }
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      };

      toast({
        title: "Sucesso",
        description: "Documento enviado para impressão"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao imprimir",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      if (!nfseId) return;
      
      setIsLoading(true);
      const { data: nfseData, error: nfseError } = await supabase
        .from('nfse')
        .select(`
          *,
          company_info (
            razao_social,
            cnpj,
            inscricao_municipal,
            endereco_logradouro,
            endereco_numero,
            endereco_complemento,
            endereco_bairro,
            endereco_cidade,
            endereco_uf,
            endereco_cep
          ),
          clients (
            name,
            document,
            street,
            street_number,
            complement,
            neighborhood,
            city,
            state,
            zip_code
          )
        `)
        .eq('id', nfseId)
        .single();

      if (nfseError) throw nfseError;

      setPreviewData(nfseData);
      setShowPreview(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar preview",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!companyData || !sefazData) {
        throw new Error("Dados da empresa ou configurações SEFAZ não encontrados");
      }

      if (!sefazData.certificado_valido) {
        throw new Error("Certificado digital inválido ou não configurado");
      }

      const { data, error } = await supabase.functions.invoke('process-nfse', {
        body: {
          formData,
          companyData,
          sefazData
        }
      });

      if (error) throw error;

      setNfseId(data.nfse_id);
      toast({
        title: "Sucesso",
        description: "NFS-e enviada para processamento"
      });

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

  const handleGeneratePDF = async () => {
    try {
      if (!nfseId) return;
      
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('generate-nfse-pdf', {
        body: { nfseId }
      });

      if (error) throw error;

      const link = document.createElement('a');
      link.href = data.pdf;
      link.download = `nfse_${nfseId}.pdf`;
      link.click();

      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      if (!nfseId) return;
      
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('send-nfse-email', {
        body: { nfseId }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Email enviado com sucesso"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      if (!nfseId) return;
      
      setIsLoading(true);
      const motivo = window.prompt("Por favor, informe o motivo do cancelamento:");
      
      if (!motivo) {
        toast({
          variant: "destructive",
          title: "Erro ao cancelar",
          description: "O motivo do cancelamento é obrigatório"
        });
        return;
      }

      const { error } = await supabase.functions.invoke('cancel-nfse', {
        body: { 
          nfseId,
          motivoCancelamento: motivo
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "NFS-e cancelada com sucesso"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar NFS-e",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!companyData || !sefazData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Carregando dados...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados do Emissor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Razão Social:</span>
                  <p>{companyData.razao_social}</p>
                </div>
                <div>
                  <span className="font-medium">CNPJ:</span>
                  <p>{companyData.cnpj}</p>
                </div>
                <div>
                  <span className="font-medium">Inscrição Municipal:</span>
                  <p>{companyData.inscricao_municipal}</p>
                </div>
                <div>
                  <span className="font-medium">Regime Tributário:</span>
                  <p>{sefazData.regime_tributario}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados da NFS-e</h3>
              
              <NFSeHeaderInfo
                numeroRps={formData.numero_rps}
                tipoRecolhimento={formData.tipo_recolhimento}
                onNumeroRpsChange={(value) => setFormData({ ...formData, numero_rps: value })}
                onTipoRecolhimentoChange={(value) => setFormData({ ...formData, tipo_recolhimento: value })}
                disabled={isLoading}
              />

              <NFSeServiceInfo
                codigoServico={formData.codigo_servico}
                discriminacaoServicos={formData.discriminacao_servicos}
                naturezaOperacao={formData.natureza_operacao}
                onCodigoServicoChange={(value) => setFormData({ ...formData, codigo_servico: value })}
                onDiscriminacaoServicosChange={(value) => setFormData({ ...formData, discriminacao_servicos: value })}
                onNaturezaOperacaoChange={(value) => setFormData({ ...formData, natureza_operacao: value })}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          {nfseId && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                Imprimir
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Visualizar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePDF}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <File className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Email
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Cancelar
              </Button>
            </>
          )}
          <Button type="submit" disabled={isLoading || !sefazData.certificado_valido}>
            {isLoading ? "Processando..." : "Emitir NFS-e"}
          </Button>
        </div>

        {!sefazData.certificado_valido && (
          <p className="text-sm text-destructive">
            Certificado digital inválido ou não configurado. Verifique as configurações SEFAZ.
          </p>
        )}
      </form>

      {nfseId && (
        <NFSeTransmissionStatus nfseId={nfseId} />
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização da NFS-e</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Prestador</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Razão Social:</span>
                    <p>{previewData.company_info.razao_social}</p>
                  </div>
                  <div>
                    <span className="font-medium">CNPJ:</span>
                    <p>{previewData.company_info.cnpj}</p>
                  </div>
                  <div>
                    <span className="font-medium">Endereço:</span>
                    <p>
                      {previewData.company_info.endereco_logradouro}, {previewData.company_info.endereco_numero}
                      {previewData.company_info.endereco_complemento ? ` - ${previewData.company_info.endereco_complemento}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Bairro/Cidade/UF:</span>
                    <p>
                      {previewData.company_info.endereco_bairro} - {previewData.company_info.endereco_cidade}/{previewData.company_info.endereco_uf}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Tomador</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Nome/Razão Social:</span>
                    <p>{previewData.clients.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">CPF/CNPJ:</span>
                    <p>{previewData.clients.document}</p>
                  </div>
                  <div>
                    <span className="font-medium">Endereço:</span>
                    <p>
                      {previewData.clients.street}, {previewData.clients.street_number}
                      {previewData.clients.complement ? ` - ${previewData.clients.complement}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Bairro/Cidade/UF:</span>
                    <p>
                      {previewData.clients.neighborhood} - {previewData.clients.city}/{previewData.clients.state}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Serviços</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Discriminação:</span>
                    <p className="whitespace-pre-wrap">{previewData.discriminacao_servicos}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Valor do Serviço:</span>
                      <p>R$ {previewData.valor_servicos?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="font-medium">Código do Serviço:</span>
                      <p>{previewData.codigo_servico}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
