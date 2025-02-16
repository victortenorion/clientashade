
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export default function ServiceOrderForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

      // Por enquanto apenas criar uma ordem vazia
      const { data, error } = await supabase
        .from("service_orders")
        .insert([
          {
            store_id: storeData.store_id,
            status_id: 1, // Assumindo que 1 é o status inicial
            total_price: 0
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

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <Label htmlFor="instructions">
            Clique em criar para iniciar uma nova ordem de serviço
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando..." : "Criar Ordem de Serviço"}
        </Button>
      </form>
    </div>
  );
}
