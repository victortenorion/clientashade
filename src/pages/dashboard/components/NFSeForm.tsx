import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { NFSeFormData } from "../types/nfse.types";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NFSeFormProps {
  onSubmit: (formData: NFSeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: NFSeFormData;
  submitButtonText?: string;
}

export const NFSeForm: React.FC<NFSeFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  initialData,
  submitButtonText = "Salvar"
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<NFSeFormData>({
    client_id: "",
    codigo_servico: "",
    discriminacao_servicos: "",
    valor_servicos: 0,
    data_competencia: new Date().toISOString().split("T")[0],
    deducoes: 0,
    observacoes: "",
    natureza_operacao: "1",
    municipio_prestacao: "",
    cnae: "",
    retencao_ir: false,
    percentual_ir: 0,
    retencao_iss: false,
    desconto_iss: false,
    retencao_inss: false,
    retencao_pis_cofins_csll: false,
    percentual_tributos_ibpt: 0,
    desconto_incondicional: 0,
    vendedor_id: "",
    comissao_percentual: 0,
    numero_rps: "",
    serie_rps: "1",
    responsavel_retencao: "T",
    local_servico: "tomador",
    optante_mei: false,
    prestador_incentivador_cultural: false,
    tributacao_rps: "T",
    tipo_rps: "RPS",
    inscricao_prestador: "",
    tipo_documento_prestador: "CNPJ",
    documento_prestador: "",
    aliquota_iss: 0,
    aliquota_pis: 0,
    aliquota_cofins: 0,
    aliquota_csll: 0,
    valor_iss: 0,
    iss_retido: "N",
    tipo_documento_tomador: "CNPJ",
    documento_tomador: "",
    razao_social_tomador: "",
    endereco_tomador: "",
    numero_endereco_tomador: "",
    complemento_endereco_tomador: "",
    bairro_tomador: "",
    cidade_tomador: "",
    uf_tomador: "",
    cep_tomador: "",
    email_tomador: "",
    valor_pis: 0,
    valor_cofins: 0,
    valor_inss: 0,
    valor_ir: 0,
    valor_csll: 0,
    outras_retencoes: 0,
    valor_carga_tributaria: 0,
    percentual_carga_tributaria: 0,
    valor_total: 0,
    status_transmissao: "pendente",
    status_sefaz: "pendente",
    situacao_nota: "N",
    opcao_simples: "N",
    regime_especial_tributacao: "1",
    tipo_servico: "P",
    data_emissao: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        valor_servicos: initialData.valor_servicos || 0,
        deducoes: initialData.deducoes || 0,
        percentual_ir: initialData.percentual_ir || 0,
        percentual_tributos_ibpt: initialData.percentual_tributos_ibpt || 0,
        desconto_incondicional: initialData.desconto_incondicional || 0,
        comissao_percentual: initialData.comissao_percentual || 0,
        aliquota_pis: initialData.aliquota_pis || 0,
        aliquota_cofins: initialData.aliquota_cofins || 0,
        aliquota_csll: initialData.aliquota_csll || 0,
        outras_retencoes: initialData.outras_retencoes || 0
      }));
    }
  }, [initialData]);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const { data: companyInfo, error } = await supabase
          .from("company_info")
          .select("cnae, endereco_cidade")
          .maybeSingle();

        if (error) throw error;

        if (companyInfo) {
          setFormData(prev => ({
            ...prev,
            cnae: companyInfo.cnae || "",
            municipio_prestacao: companyInfo.endereco_cidade || ""
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar informações da empresa:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar as informações da empresa"
        });
      }
    };

    const fetchNFSeConfig = async () => {
      try {
        const { data: spConfig, error: spError } = await supabase
          .from("nfse_sp_config")
          .select("*")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (spError) throw spError;

        if (!spConfig) {
          console.error('Nenhuma configuração encontrada');
          return;
        }

        let proximoNumeroRPS: string;

        if (spConfig.numero_inicial_rps && spConfig.numero_inicial_rps > 0) {
          if (!spConfig.ultima_rps_numero || spConfig.ultima_rps_numero < spConfig.numero_inicial_rps) {
            proximoNumeroRPS = spConfig.numero_inicial_rps.toString();
          } else {
            proximoNumeroRPS = (spConfig.ultima_rps_numero + 1).toString();
          }
        } else {
          proximoNumeroRPS = ((spConfig.ultima_rps_numero || 0) + 1).toString();
        }

        console.log('Config encontrada:', spConfig);
        console.log('Próximo número RPS calculado:', proximoNumeroRPS);

        setFormData(prev => ({
          ...prev,
          numero_rps: proximoNumeroRPS
        }));
      } catch (error) {
        console.error("Erro ao buscar configuração da NFS-e:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível obter o próximo número do RPS"
        });
      }
    };

    fetchCompanyInfo();
    fetchNFSeConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: config, error: configError } = await supabase
        .from("nfse_sp_config")
        .select("id")
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (configError) throw configError;

      if (!config) {
        throw new Error("Configuração não encontrada");
      }

      const { error: updateError } = await supabase
        .from("nfse_sp_config")
        .update({ 
          ultima_rps_numero: parseInt(formData.numero_rps || "0", 10)
        })
        .eq('id', config.id);

      if (updateError) {
        throw updateError;
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Erro ao atualizar número do RPS:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o número do RPS"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Dados do RPS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_rps">Número RPS</Label>
              <Input
                id="numero_rps"
                value={formData.numero_rps}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_rps: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serie_rps">Série RPS</Label>
              <Input
                id="serie_rps"
                value={formData.serie_rps}
                onChange={(e) => setFormData(prev => ({ ...prev, serie_rps: e.target.value }))}
                readOnly
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Dados do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="natureza_operacao">Natureza da Operação *</Label>
              <Select
                value={formData.natureza_operacao}
                onValueChange={(value) => setFormData(prev => ({ ...prev, natureza_operacao: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a natureza da operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Tributação no município de São Paulo</SelectItem>
                  <SelectItem value="2">2 - Tributação fora do município de São Paulo</SelectItem>
                  <SelectItem value="3">3 - Isenção</SelectItem>
                  <SelectItem value="4">4 - Imune</SelectItem>
                  <SelectItem value="5">5 - Exigibilidade suspensa por decisão judicial</SelectItem>
                  <SelectItem value="6">6 - Exigibilidade suspensa por procedimento administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="municipio_prestacao">Município de Prestação</Label>
                <Input
                  id="municipio_prestacao"
                  value={formData.municipio_prestacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, municipio_prestacao: e.target.value }))}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnae">CNAE</Label>
                <Input
                  id="cnae"
                  value={formData.cnae}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnae: e.target.value }))}
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_servico">Código do Serviço *</Label>
              <Input
                id="codigo_servico"
                value={formData.codigo_servico}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo_servico: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discriminacao_servicos">Descrição dos Serviços *</Label>
              <Textarea
                id="discriminacao_servicos"
                value={formData.discriminacao_servicos}
                onChange={(e) => setFormData(prev => ({ ...prev, discriminacao_servicos: e.target.value }))}
                placeholder="Detalhe os serviços prestados"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Valores e Impostos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_servicos">Valor Total dos Serviços *</Label>
              <Input
                id="valor_servicos"
                type="number"
                step="0.01"
                value={formData.valor_servicos}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_servicos: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="desconto_incondicional">Desconto Incondicional</Label>
              <Input
                id="desconto_incondicional"
                type="number"
                step="0.01"
                value={formData.desconto_incondicional}
                onChange={(e) => setFormData(prev => ({ ...prev, desconto_incondicional: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentual_ir">Percentual IR (%)</Label>
              <Input
                id="percentual_ir"
                type="number"
                step="0.01"
                value={formData.percentual_ir}
                onChange={(e) => setFormData(prev => ({ ...prev, percentual_ir: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentual_tributos_ibpt">Percentual Tributos IBPT (%)</Label>
              <Input
                id="percentual_tributos_ibpt"
                type="number"
                step="0.01"
                value={formData.percentual_tributos_ibpt}
                onChange={(e) => setFormData(prev => ({ ...prev, percentual_tributos_ibpt: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Retenções de Impostos</Label>
              <Select
                value={formData.retencao_ir ? "sim" : "nao"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, retencao_ir: value === "sim" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reter IR?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Retenção ISS</Label>
              <Select
                value={formData.retencao_iss ? "sim" : "nao"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, retencao_iss: value === "sim" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reter ISS?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Desconto ISS</Label>
              <Select
                value={formData.desconto_iss ? "sim" : "nao"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, desconto_iss: value === "sim" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Descontar ISS?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Retenção INSS</Label>
              <Select
                value={formData.retencao_inss ? "sim" : "nao"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, retencao_inss: value === "sim" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reter INSS?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Retenção PIS/COFINS/CSLL</Label>
              <Select
                value={formData.retencao_pis_cofins_csll ? "sim" : "nao"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, retencao_pis_cofins_csll: value === "sim" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reter PIS/COFINS/CSLL?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Dados do Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendedor_id">Vendedor</Label>
              <Input
                id="vendedor_id"
                value={formData.vendedor_id}
                onChange={(e) => setFormData(prev => ({ ...prev, vendedor_id: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissao_percentual">Comissão (%)</Label>
              <Input
                id="comissao_percentual"
                type="number"
                step="0.01"
                value={formData.comissao_percentual}
                onChange={(e) => setFormData(prev => ({ ...prev, comissao_percentual: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : submitButtonText}
        </Button>
      </div>
    </form>
  );
};
