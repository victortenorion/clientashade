
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Tente novamente em alguns instantes.",
      });
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    // Verifica se o usuário está autenticado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    
    checkUser();

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Sair
        </Button>
      </header>
      <main className="p-4">
        <h2 className="text-xl">Bem-vindo ao Dashboard!</h2>
        <p className="mt-2 text-gray-600">
          Este é o seu painel de controle. Aqui você poderá acessar todas as funcionalidades do sistema.
        </p>
      </main>
    </div>
  );
};

export default Dashboard;
