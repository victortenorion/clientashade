
import { Link, useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Home, FileText, Users, Store, FileCheck2, Cog } from "lucide-react";

interface SidebarGroupsProps {
  userPermissions: string[];
}

export const SidebarGroups = ({ userPermissions }: SidebarGroupsProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                location.pathname === "/dashboard" ? "bg-accent" : ""
              }`}
            >
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>
        {userPermissions.includes("menu_os") && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Ordem de Serviço
            </h2>
            <div className="space-y-1">
              <Link
                to="/dashboard/ordens-servico"
                className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                  isActive("/ordens-servico") ? "bg-accent" : ""
                }`}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>Ordens de Serviço</span>
              </Link>
              <Link
                to="/dashboard/servicos"
                className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                  isActive("/servicos") ? "bg-accent" : ""
                }`}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Serviços</span>
              </Link>
              <Link
                to="/dashboard/configuracoes/notas-fiscais"
                className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                  isActive("/configuracoes/notas-fiscais") ? "bg-accent" : ""
                }`}
              >
                <FileCheck2 className="mr-2 h-4 w-4" />
                <span>Notas Fiscais</span>
              </Link>
              <Link
                to="/dashboard/configuracoes/sefaz"
                className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                  isActive("/configuracoes/sefaz") ? "bg-accent" : ""
                }`}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>SEFAZ</span>
              </Link>
              <Link
                to="/dashboard/configuracoes/nfse-sp"
                className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                  isActive("/configuracoes/nfse-sp") ? "bg-accent" : ""
                }`}
              >
                <Cog className="mr-2 h-4 w-4" />
                <span>NFSe-SP</span>
              </Link>
            </div>
          </div>
        )}
        {userPermissions.includes("menu_clientes") && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Clientes
            </h2>
            <div className="space-y-1">
              <Link
                to="/dashboard/clientes"
                className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                  isActive("/clientes") ? "bg-accent" : ""
                }`}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Clientes</span>
              </Link>
            </div>
          </div>
        )}
        {userPermissions.includes("menu_lojas") && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Lojas
            </h2>
            <div className="space-y-1">
              <Link
                to="/dashboard/lojas"
                className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                  isActive("/lojas") ? "bg-accent" : ""
                }`}
              >
                <Store className="mr-2 h-4 w-4" />
                <span>Lojas</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
