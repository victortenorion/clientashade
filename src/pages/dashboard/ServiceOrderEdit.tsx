
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";

export default function ServiceOrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<{ id: string, file_name: string }[]>([]);
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
      const { data: orderData, error: orderError } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      // Buscar anexos
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('service_order_attachments')
        .select('*')
        .eq('service_order_id', id);

      if (attachmentsError) throw attachmentsError;

      setAttachments(attachmentsData || []);

      // Atualizar o formData com os dados da ordem
      setFormData({
        description: orderData.description || "",
        equipment: orderData.equipment || "",
        equipment_serial_number: orderData.equipment_serial_number || "",
        problem: orderData.problem || "",
        priority: orderData.priority || "normal",
        codigo_servico: orderData.codigo_servico || "",
        discriminacao_servico: orderData.discriminacao_servico || "",
        regime_tributario: orderData.regime_tributario || "1",
        regime_especial: orderData.regime_especial || "",
        iss_retido: orderData.iss_retido || false,
        inss_retido: orderData.inss_retido || false,
        ir_retido: orderData.ir_retido || false,
        pis_cofins_csll_retido: orderData.pis_cofins_csll_retido || false,
        aliquota_iss: orderData.aliquota_iss || 0,
        base_calculo: orderData.base_calculo || 0,
        valor_deducoes: orderData.valor_deducoes || 0
      });

      return orderData;
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('serviceOrderId', id || '');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-attachment`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Atualizar a lista de anexos
      const { data: newAttachment, error: attachmentError } = await supabase
        .from('service_order_attachments')
        .select('*')
        .eq('id', result.id)
        .single();

      if (attachmentError) throw attachmentError;

      setAttachments(prev => [...prev, newAttachment]);

      toast({
        title: "Arquivo enviado com sucesso",
        description: "O arquivo foi anexado à ordem de serviço."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar arquivo",
        description: error.message
      });
    } finally {
      setUploading(false);
    }
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

          {/* Área de Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Anexos</h3>
            
            <div className="space-y-2">
              <Label htmlFor="file">Adicionar Anexo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <div>Enviando...</div>}
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Arquivos anexados:</h4>
                  <ul className="space-y-2">
                    {attachments.map((attachment) => (
                      <li key={attachment.id} className="text-sm">
                        {attachment.file_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

