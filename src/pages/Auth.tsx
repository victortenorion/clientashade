
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
          <CardDescription>
            Escolha como deseja acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full py-6 text-lg"
            onClick={() => navigate('/client-login')}
          >
            Área do Cliente
          </Button>
          <Button
            className="w-full py-6 text-lg"
            variant="outline"
            onClick={() => navigate('/auth/admin')}
          >
            Área do Administrador
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
