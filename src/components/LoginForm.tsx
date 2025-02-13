
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema.",
        });
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
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" type="submit" disabled={loading}>
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
