
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function LicenseRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center text-red-600">
            Licença Necessária
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center">
            Este sistema requer uma licença válida para funcionar.
            Entre em contato com o desenvolvedor para obter uma licença.
          </p>
          <div className="text-center">
            <a
              href="mailto:seu-email@exemplo.com"
              className="text-primary hover:underline"
            >
              Contatar Desenvolvedor
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
