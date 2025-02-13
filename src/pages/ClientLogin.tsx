
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export function ClientLogin() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: clientId, error } = await supabase.rpc('check_client_credentials', {
        p_login: login,
        p_password: password
      });

      if (error) throw error;

      if (clientId) {
        localStorage.setItem('clientId', clientId);
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo à área do cliente.",
        });
        navigate("/customer-area"); // Atualizado para a nova rota
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: "Login ou senha incorretos.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-[350px]">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">Área do Cliente</h2>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Seu login"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Processando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default ClientLogin;
