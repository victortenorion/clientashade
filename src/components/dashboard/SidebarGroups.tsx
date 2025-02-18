
import { Link, useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Home, FileText, Users, Store, FileCheck2, Cog, Building2, Receipt } from "lucide-react";

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
        {/* Home sempre visível */}
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

        {/* Ordem de Serviço */}
        {userPermissions.includes("service_orders") && (
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
              {userPermissions.includes("service_order_settings") && (
                <>
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
                    to="/dashboard/configuracoes/status"
                    className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                      isActive("/configuracoes/status") ? "bg-accent" : ""
                    }`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Status</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* NFe/NFCe */}
        {userPermissions.includes("nfce") && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Notas Fiscais
            </h2>
            <div className="space-y-1">
              <Link
                to="/dashboard/nfce"
                className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                  isActive("/nfce") ? "bg-accent" : ""
                }`}
              >
                <Receipt className="mr-2 h-4 w-4" />
                <span>NFCe</span>
              </Link>
              {userPermissions.includes("nfse") && (
                <Link
                  to="/dashboard/nfse"
                  className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                    isActive("/nfse") ? "bg-accent" : ""
                  }`}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  <span>NFSe</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Clientes */}
        {userPermissions.includes("clients") && (
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
              {userPermissions.includes("customer_area") && (
                <Link
                  to="/dashboard/configuracoes/area-cliente"
                  className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                    isActive("/configuracoes/area-cliente") ? "bg-accent" : ""
                  }`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Área do Cliente</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Lojas */}
        {userPermissions.includes("stores") && (
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
