
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão:", error);
          return;
        }

        if (session) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Estado da autenticação alterado:", event, session);
      if (event === 'SIGNED_IN' && session) {
        navigate("/dashboard");
      } else if (event === 'SIGNED_OUT') {
        console.log("Usuário desconectado");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Tentando fazer login com:", { email });
      
      // Tenta fazer login
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Erro de login:", signInError);
        let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente.";
        
        if (signInError.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos";
        } else if (signInError.message.includes("Email not confirmed")) {
          errorMessage = "Por favor, confirme seu email antes de fazer login";
        }
        
        throw new Error(errorMessage);
      }

      if (data.session) {
        console.log("Login bem-sucedido:", data.session.user.id);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          localStorage.setItem('supabase.refresh-token', session.refresh_token || '');
          
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo ao sistema.",
          });
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Erro completo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[350px] space-y-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Card>
          <CardHeader className="text-center">
            <h2 className="text-2xl font-bold">Login</h2>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                type="submit" 
                disabled={loading}
              >
                {loading ? "Processando..." : "Entrar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
