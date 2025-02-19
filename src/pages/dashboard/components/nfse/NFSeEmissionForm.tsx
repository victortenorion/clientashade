import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { NFSeServiceInfo } from "./NFSeServiceInfo";
import { NFSeHeaderInfo } from "./NFSeHeaderInfo";
import { NFSeTransmissionStatus } from "./NFSeTransmissionStatus";

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
      // Carregar dados da empresa
      const { data: companyInfo, error: companyError } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (companyError) throw companyError;
      setCompanyData(companyInfo);

      // Carregar configurações SEFAZ
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
    </div>
  );
}
