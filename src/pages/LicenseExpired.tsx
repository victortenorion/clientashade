
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function LicenseExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center text-red-600">
            Licença Expirada
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center">
            A licença deste sistema expirou.
            Entre em contato com o desenvolvedor para renovar sua licença.
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
