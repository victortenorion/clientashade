
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface PasswordRequirement {
  regex: RegExp;
  text: string;
  met: boolean;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { regex: /.{8,}/, text: "Mínimo de 8 caracteres", met: false },
    { regex: /[A-Z]/, text: "Uma letra maiúscula", met: false },
    { regex: /[a-z]/, text: "Uma letra minúscula", met: false },
    { regex: /[0-9]/, text: "Um número", met: false },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, text: "Um caractere especial", met: false },
  ]);

  const updatePasswordRequirements = (password: string) => {
    setPasswordRequirements(prev =>
      prev.map(req => ({
        ...req,
        met: req.regex.test(password)
      }))
    );
  };

  useEffect(() => {
    updatePasswordRequirements(password);
  }, [password]);

  // Verifica se o usuário já está autenticado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    
    checkUser();
  }, [navigate]);

  const isPasswordValid = passwordRequirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && !isPasswordValid) {
      toast({
        variant: "destructive",
        title: "Senha inválida",
        description: "Por favor, atenda a todos os requisitos de senha.",
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        toast({
          title: "Conta criada com sucesso!",
          description: "Agora você pode fazer login.",
        });
        setIsSignUp(false);
      } else {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.session) {
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo ao sistema.",
          });
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Erro completo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao " + (isSignUp ? "criar conta" : "fazer login"),
        description: "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader className="text-center">
        <h2 className="text-2xl font-bold">{isSignUp ? "Criar Conta" : "Login"}</h2>
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
            {isSignUp && (
              <div className="mt-2 space-y-2">
                <p className="text-sm font-medium text-gray-700">Requisitos da senha:</p>
                <ul className="text-sm space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li 
                      key={index}
                      className={`flex items-center gap-2 ${
                        req.met ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {req.met ? '✓' : '○'} {req.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            type="submit" 
            disabled={loading || (isSignUp && !isPasswordValid)}
          >
            {loading ? "Processando..." : (isSignUp ? "Criar Conta" : "Entrar")}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Já tem uma conta? Faça login" : "Não tem uma conta? Cadastre-se"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
