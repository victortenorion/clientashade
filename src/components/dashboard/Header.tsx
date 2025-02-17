
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
  username: string;
  onLogout: () => void;
}

export const Header = ({ username, onLogout }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="p-4 flex justify-between items-center border-b">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {location.pathname.includes('service-order-settings') ? 'Configurações' : 'Dashboard'}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Olá, {username || "Usuário"}
        </span>
        <Button variant="outline" onClick={onLogout}>
          Sair
        </Button>
      </div>
    </header>
  );
};
