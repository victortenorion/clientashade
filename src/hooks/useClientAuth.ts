
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const useClientAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const login = async (clientLogin: string, clientPassword: string) => {
    setLoading(true);

    try {
      const { data: clientId, error } = await supabase.rpc('check_client_credentials', {
        p_login: clientLogin,
        p_password: clientPassword
      });

      if (error) throw error;

      if (clientId) {
        localStorage.setItem('clientId', clientId);
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo à área do cliente.",
        });
        navigate(`/customer-area/${clientId}`);
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: "Login ou senha incorretos.",
        });
        return false;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('clientId');
    navigate('/client-login');
  };

  const checkAuth = (routeClientId: string | undefined) => {
    const storedClientId = localStorage.getItem('clientId');
    
    if (!storedClientId || !routeClientId) {
      return false;
    }

    return storedClientId === routeClientId;
  };

  return {
    loading,
    login,
    logout,
    checkAuth
  };
};
