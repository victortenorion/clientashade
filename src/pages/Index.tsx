
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex justify-end">
        <ThemeToggle />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center space-y-8">
        <h1 className="text-4xl font-bold text-center">Bem-vindo ao Sistema</h1>
        <div className="flex gap-4">
          <Link to="/client-login">
            <Button size="lg">
              Área do Cliente
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
