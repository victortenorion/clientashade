import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client } from "./types/client.types";

export default function ServiceOrderForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(true);
  const [initialStatusId, setInitialStatusId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_id: "",
    description: "",
    equipment: "",
    equipment_serial_number: "",
    problem: "",
    priority: "normal",
    // Campos NFS-e
    codigo_servico: "",
    discriminacao_servico: "",
    regime_tributario: "1", // Simples Nacional
    regime_especial: "",
    iss_retido: false,
    inss_retido: false,
    ir_retido: false,
    pis_cofins_csll_retido: false,
    aliquota_iss: 0,
    base_calculo: 0,
    valor_deducoes: 0
  });

  useEffect(() => {
    loadClients();
    loadCompanyInfo();
    loadInitialStatus();
  }, []);

  const loadInitialStatus = async () => {
    try {
      const { data: statusData, error } = await supabase
        .from('service_order_statuses')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;
      if (statusData) {
        setInitialStatusId(statusData.id);
      }
    } catch (error: any) {
      console.error('Erro ao carregar status inicial:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar status inicial",
        description: error.message
      });
    }
  };

  const loadClients = async () => {
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(clientsData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error.message
      });
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('codigo_servico')
        .single();

      if (error) throw error;

      if (data?.codigo_servico) {
        setFormData(prev => ({
          ...prev,
          codigo_servico: data.codigo_servico
        }));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar informações da empresa",
        description: error.message
      });
    } finally {
      setLoadingCompanyInfo(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
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
      if (!initialStatusId) {
        throw new Error("Status inicial não encontrado");
      }

      // Primeiro, buscar a loja do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: storeData, error: storeError } = await supabase
        .from("user_stores")
        .select("store_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!storeData?.store_id) throw new Error("Usuário não está associado a uma loja");

      if (!formData.client_id) {
        throw new Error("Por favor, selecione um cliente");
      }

      // Criar a ordem com os dados do formulário
      const { data, error } = await supabase
        .from("service_orders")
        .insert([
          {
            store_id: storeData.store_id,
            status_id: initialStatusId,
            total_price: 0,
            ...formData
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ordem de serviço criada",
        description: "Redirecionando para edição..."
      });

      // Redirecionar para a página de detalhes da ordem
      navigate(`/dashboard/service-orders/${data.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar ordem de serviço",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

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
        <h2 className="text-2xl font-bold">Nova Ordem de Serviço</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div className="space-y-4">
          {/* Seleção de Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => handleSelectChange('client_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                required
                disabled={loadingCompanyInfo}
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
                required
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
          {loading ? "Criando..." : "Criar Ordem de Serviço"}
        </Button>
      </form>
    </div>
  );
}
