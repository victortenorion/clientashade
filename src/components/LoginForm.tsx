import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

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
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // Verifica se o usuário precisa confirmar o email
        if (data?.user?.identities?.length === 0) {
          toast({
            variant: "destructive",
            title: "Email já cadastrado",
            description: "Este email já está em uso. Por favor, faça login.",
          });
          setIsSignUp(false);
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Por favor, verifique seu email para confirmar a conta.",
          });
          setIsSignUp(false);
        }
      } else {
        console.log("Tentando fazer login com:", { email });
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error("Erro de login:", signInError);
          // Mensagem mais específica baseada no erro
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Email ou senha incorretos");
          }
          throw signInError;
        }

        if (data.session) {
          console.log("Login bem-sucedido:", data.session.user.id);
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
        title: "Erro ao " + (isSignUp ? "criar conta" : "fazer login"),
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
      </div>
    </div>
  );
}
