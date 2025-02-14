
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface CompanyInfo {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  cnae: string | null;
  regime_tributario: string | null;
  endereco_cep: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  endereco_codigo_municipio: string | null;
  telefone: string | null;
  email: string | null;
}

export const CompanyInfoTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    id: "",
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    cnae: "",
    regime_tributario: "",
    endereco_cep: "",
    endereco_logradouro: "",
    endereco_numero: "",
    endereco_complemento: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_uf: "",
    endereco_codigo_municipio: "",
    telefone: "",
    email: "",
  });

  const loadCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa.",
        variant: "destructive"
      });
    }
  };

  const searchCNPJ = async (cnpj: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${window.location.origin}/functions/v1/document-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ document: cnpj })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.apiData) {
        const addressParts = data.apiData.address.split(',').map((part: string) => part.trim());
        const [logradouro, numero] = addressParts[0].split(' ');
        const bairro = addressParts[1];
        const [cidade, uf] = addressParts[2].split('-').map((part: string) => part.trim());
        const cep = addressParts[3];

        setCompanyInfo(prev => ({
          ...prev,
          razao_social: data.apiData.name,
          nome_fantasia: data.apiData.name,
          email: data.apiData.email,
          telefone: data.apiData.phone,
          endereco_logradouro: logradouro,
          endereco_numero: numero,
          endereco_bairro: bairro,
          endereco_cidade: cidade,
          endereco_uf: uf,
          endereco_cep: cep
        }));

        toast({
          title: "Sucesso",
          description: "Dados da empresa carregados com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os dados do CNPJ.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCNPJChange = (value: string) => {
    setCompanyInfo(prev => ({ ...prev, cnpj: value }));
    
    // Remove caracteres não numéricos
    const cleanCNPJ = value.replace(/\D/g, '');
    
    // Se o CNPJ estiver completo (14 dígitos), faz a busca
    if (cleanCNPJ.length === 14) {
      searchCNPJ(cleanCNPJ);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('company_info')
        .upsert(companyInfo);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados da empresa salvos com sucesso.",
      });

      loadCompanyInfo();
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados da empresa.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <div className="flex gap-2">
                <Input
                  value={companyInfo.cnpj}
                  onChange={(e) => handleCNPJChange(e.target.value)}
                  disabled={isLoading}
                  placeholder="Digite o CNPJ para buscar os dados"
                />
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input
                value={companyInfo.razao_social}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, razao_social: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input
                value={companyInfo.nome_fantasia || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, nome_fantasia: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input
                value={companyInfo.inscricao_estadual || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, inscricao_estadual: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Inscrição Municipal</Label>
              <Input
                value={companyInfo.inscricao_municipal || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, inscricao_municipal: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>CNAE</Label>
              <Input
                value={companyInfo.cnae || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, cnae: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select
                value={companyInfo.regime_tributario || ""}
                onValueChange={(value) =>
                  setCompanyInfo({ ...companyInfo, regime_tributario: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime tributário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={companyInfo.endereco_cep || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, endereco_cep: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Logradouro</Label>
              <Input
                value={companyInfo.endereco_logradouro || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, endereco_logradouro: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={companyInfo.endereco_numero || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, endereco_numero: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input
                value={companyInfo.endereco_complemento || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, endereco_complemento: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={companyInfo.endereco_bairro || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, endereco_bairro: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={companyInfo.endereco_cidade || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, endereco_cidade: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>UF</Label>
              <Input
                value={companyInfo.endereco_uf || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, endereco_uf: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Código do Município</Label>
              <Input
                value={companyInfo.endereco_codigo_municipio || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, endereco_codigo_municipio: e.target.value })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={companyInfo.telefone || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, telefone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={companyInfo.email || ""}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              Salvar Dados da Empresa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
