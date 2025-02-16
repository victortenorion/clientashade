
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";

export default function ServiceOrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    equipment: "",
    equipment_serial_number: "",
    problem: "",
    priority: "normal",
    codigo_servico: "",
    discriminacao_servico: "",
    regime_tributario: "1",
    regime_especial: "",
    iss_retido: false,
    inss_retido: false,
    ir_retido: false,
    pis_cofins_csll_retido: false,
    aliquota_iss: 0,
    base_calculo: 0,
    valor_deducoes: 0
  });

  // Buscar dados da ordem de serviço
  const { data: serviceOrder, isLoading } = useQuery({
    queryKey: ['serviceOrder', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Atualizar o formData aqui ao invés de usar onSuccess
      setFormData({
        description: data.description || "",
        equipment: data.equipment || "",
        equipment_serial_number: data.equipment_serial_number || "",
        problem: data.problem || "",
        priority: data.priority || "normal",
        codigo_servico: data.codigo_servico || "",
        discriminacao_servico: data.discriminacao_servico || "",
        regime_tributario: data.regime_tributario || "1",
        regime_especial: data.regime_especial || "",
        iss_retido: data.iss_retido || false,
        inss_retido: data.inss_retido || false,
        ir_retido: data.ir_retido || false,
        pis_cofins_csll_retido: data.pis_cofins_csll_retido || false,
        aliquota_iss: data.aliquota_iss || 0,
        base_calculo: data.base_calculo || 0,
        valor_deducoes: data.valor_deducoes || 0
      });

      return data;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("service_orders")
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Ordem de serviço atualizada",
        description: "As alterações foram salvas com sucesso."
      });

      // Alterado aqui: redirecionar para a lista de ordens
      navigate("/dashboard/service-orders");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar ordem de serviço",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Editar Ordem de Serviço #{serviceOrder?.order_number}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div className="space-y-4">
          {/* Informações do Equipamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações do Equipamento</h3>
            
            <div>
              <Label htmlFor="equipment">Equipamento</Label>
              <Input
                id="equipment"
                name="equipment"
                value={formData.equipment}
                onChange={handleChange}
                placeholder="Ex: Notebook Dell"
              />
            </div>

            <div>
              <Label htmlFor="equipment_serial_number">Número de Série</Label>
              <Input
                id="equipment_serial_number"
                name="equipment_serial_number"
                value={formData.equipment_serial_number}
                onChange={handleChange}
                placeholder="Ex: ABC123XYZ"
              />
            </div>

            <div>
              <Label htmlFor="problem">Problema Relatado</Label>
              <Textarea
                id="problem"
                name="problem"
                value={formData.problem}
                onChange={handleChange}
                placeholder="Descreva o problema relatado pelo cliente"
                rows={3}
              />
            </div>
          </div>

          {/* Informações para NFS-e */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold">Informações para NFS-e</h3>
            
            <div>
              <Label htmlFor="codigo_servico">Código do Serviço (LC 116)</Label>
              <Input
                id="codigo_servico"
                name="codigo_servico"
                value={formData.codigo_servico}
                onChange={handleChange}
                placeholder="Ex: 14.01"
              />
            </div>

            <div>
              <Label htmlFor="discriminacao_servico">Discriminação do Serviço</Label>
              <Textarea
                id="discriminacao_servico"
                name="discriminacao_servico"
                value={formData.discriminacao_servico}
                onChange={handleChange}
                placeholder="Descrição detalhada do serviço para a nota fiscal"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_calculo">Base de Cálculo</Label>
                <Input
                  id="base_calculo"
                  name="base_calculo"
                  type="number"
                  step="0.01"
                  value={formData.base_calculo}
                  onChange={handleChange}
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label htmlFor="aliquota_iss">Alíquota ISS (%)</Label>
                <Input
                  id="aliquota_iss"
                  name="aliquota_iss"
                  type="number"
                  step="0.01"
                  value={formData.aliquota_iss}
                  onChange={handleChange}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="iss_retido">ISS Retido</Label>
                <Switch
                  id="iss_retido"
                  checked={formData.iss_retido}
                  onCheckedChange={() => handleSwitchChange('iss_retido')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="inss_retido">INSS Retido</Label>
                <Switch
                  id="inss_retido"
                  checked={formData.inss_retido}
                  onCheckedChange={() => handleSwitchChange('inss_retido')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ir_retido">IR Retido</Label>
                <Switch
                  id="ir_retido"
                  checked={formData.ir_retido}
                  onCheckedChange={() => handleSwitchChange('ir_retido')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="pis_cofins_csll_retido">PIS/COFINS/CSLL Retido</Label>
                <Switch
                  id="pis_cofins_csll_retido"
                  checked={formData.pis_cofins_csll_retido}
                  onCheckedChange={() => handleSwitchChange('pis_cofins_csll_retido')}
                />
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </div>
  );
}
