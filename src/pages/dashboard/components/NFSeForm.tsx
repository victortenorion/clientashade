
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import type { NFSeFormData } from "../types/nfse.types";

interface NFSeFormProps {
  onSubmit: (formData: NFSeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: NFSeFormData;
}

export const NFSeForm: React.FC<NFSeFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  initialData
}) => {
  const [formData, setFormData] = useState<NFSeFormData>({
    client_id: "",
    codigo_servico: "",
    discriminacao_servicos: "",
    valor_servicos: 0,
    data_competencia: new Date().toISOString().split("T")[0],
    deducoes: 0,
    observacoes: "",
    natureza_operacao: "",
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
    serie_rps: "1"
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const { data: companyInfo, error } = await supabase
          .from("company_info")
          .select("cnae, endereco_cidade")
          .single();

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
      }
    };

    const fetchNFSeConfig = async () => {
      try {
        const { data: config, error } = await supabase
          .from("nfse_config")
          .select("ultima_rps_numero")
          .single();

        if (error) throw error;

        if (config) {
          const proximoNumeroRPS = (config.ultima_rps_numero + 1).toString();
          setFormData(prev => ({
            ...prev,
            numero_rps: proximoNumeroRPS
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar configuração da NFS-e:", error);
      }
    };

    fetchCompanyInfo();
    fetchNFSeConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
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
                readOnly
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
              <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
              <Input
                id="natureza_operacao"
                value={formData.natureza_operacao}
                onChange={(e) => setFormData(prev => ({ ...prev, natureza_operacao: e.target.value }))}
              />
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="retencao_ir"
                checked={formData.retencao_ir}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, retencao_ir: checked as boolean }))
                }
              />
              <Label htmlFor="retencao_ir">Reter IR</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="retencao_iss"
                checked={formData.retencao_iss}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, retencao_iss: checked as boolean }))
                }
              />
              <Label htmlFor="retencao_iss">Reter ISS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="desconto_iss"
                checked={formData.desconto_iss}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, desconto_iss: checked as boolean }))
                }
              />
              <Label htmlFor="desconto_iss">Descontar ISS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="retencao_inss"
                checked={formData.retencao_inss}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, retencao_inss: checked as boolean }))
                }
              />
              <Label htmlFor="retencao_inss">Reter INSS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="retencao_pis_cofins_csll"
                checked={formData.retencao_pis_cofins_csll}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, retencao_pis_cofins_csll: checked as boolean }))
                }
              />
              <Label htmlFor="retencao_pis_cofins_csll">Reter CSLL, PIS e COFINS</Label>
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
          {isLoading ? "Emitindo..." : "Emitir NFS-e"}
        </Button>
      </div>
    </form>
  );
};
