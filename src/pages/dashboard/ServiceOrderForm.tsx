
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function ServiceOrderForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    equipment: "",
    equipment_serial_number: "",
    problem: "",
    priority: "normal"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      // Criar a ordem com os dados do formulário
      const { data, error } = await supabase
        .from("service_orders")
        .insert([
          {
            store_id: storeData.store_id,
            status_id: 1, // Assumindo que 1 é o status inicial
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

          <div>
            <Label htmlFor="description">Descrição do Serviço</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva o serviço a ser realizado"
              rows={3}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando..." : "Criar Ordem de Serviço"}
        </Button>
      </form>
    </div>
  );
}
