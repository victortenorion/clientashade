
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

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
              <Label>CNPJ</Label>
              <Input
                value={companyInfo.cnpj}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, cnpj: e.target.value })
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
