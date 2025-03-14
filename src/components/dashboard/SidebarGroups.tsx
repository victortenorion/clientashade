import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  User as UserIcon,
  Package,
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  Settings,
  Store,
  Receipt,
  Database,
  Building,
  Lock,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

interface SidebarGroupsProps {
  userPermissions: string[];
}

export const SidebarGroups = ({ userPermissions }: SidebarGroupsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cadastrosOpen, setCadastrosOpen] = useState(true);
  const [ordensOpen, setOrdensOpen] = useState(true);
  const [notasFiscaisOpen, setNotasFiscaisOpen] = useState(true);
  const [configuracoesOpen, setConfiguracoesOpen] = useState(true);

  console.log("SidebarGroups - Current location:", location.pathname);
  console.log("SidebarGroups - User permissions:", userPermissions);

  const hasPermission = (permission: string) => {
    if (!userPermissions) return false;
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  return (
    <>
      {hasPermission('dashboard') && (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate("/dashboard")}
              isActive={location.pathname === "/dashboard"}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      )}

      <SidebarGroup>
        <SidebarGroupLabel 
          onClick={() => setCadastrosOpen(!cadastrosOpen)} 
          className="cursor-pointer hover:bg-muted/50 rounded-md"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>Cadastros</span>
          </div>
        </SidebarGroupLabel>
        {cadastrosOpen && (
          <SidebarGroupContent>
            <SidebarMenu>
              {hasPermission('clients') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/clients")}
                    isActive={location.pathname.includes("/dashboard/clients")}
                  >
                    <Users className="h-4 w-4" />
                    <span>Clientes</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {hasPermission('users') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/users")}
                    isActive={location.pathname.includes("/dashboard/users")}
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Usuários</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {hasPermission('products') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/products")}
                    isActive={location.pathname.includes("/dashboard/products")}
                  >
                    <Package className="h-4 w-4" />
                    <span>Produtos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {hasPermission('stores') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/stores")}
                    isActive={location.pathname.includes("/dashboard/stores")}
                  >
                    <Store className="h-4 w-4" />
                    <span>Lojas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel 
          onClick={() => setOrdensOpen(!ordensOpen)} 
          className="cursor-pointer hover:bg-muted/50 rounded-md"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Ordem de Serviço</span>
          </div>
        </SidebarGroupLabel>
        {ordensOpen && (
          <SidebarGroupContent>
            <SidebarMenu>
              {hasPermission('service_orders') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/service-orders")}
                    isActive={location.pathname.includes("/dashboard/service-orders") && !location.pathname.includes("settings")}
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>Listar Ordens</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel 
          onClick={() => setNotasFiscaisOpen(!notasFiscaisOpen)} 
          className="cursor-pointer hover:bg-muted/50 rounded-md"
        >
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>Notas Fiscais</span>
          </div>
        </SidebarGroupLabel>
        {notasFiscaisOpen && (
          <SidebarGroupContent>
            <SidebarMenu>
              {hasPermission('nfce') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/nfce")}
                    isActive={location.pathname.includes("/dashboard/nfce")}
                  >
                    <Receipt className="h-4 w-4" />
                    <span>NFC-e</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {hasPermission('nfse') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/nfse")}
                    isActive={location.pathname.includes("/dashboard/nfse")}
                  >
                    <Receipt className="h-4 w-4" />
                    <span>NFS-e</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>

      {hasPermission('service_order_settings') && (
        <SidebarGroup>
          <SidebarGroupLabel 
            onClick={() => setConfiguracoesOpen(!configuracoesOpen)} 
            className="cursor-pointer hover:bg-muted/50 rounded-md"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </div>
          </SidebarGroupLabel>
          {configuracoesOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/service-order-settings")}
                    isActive={location.pathname === "/dashboard/service-order-settings"}
                  >
                    <Database className="h-4 w-4" />
                    <span>Status</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/service-order-settings/dados-empresa")}
                    isActive={location.pathname === "/dashboard/service-order-settings/dados-empresa"}
                  >
                    <Building className="h-4 w-4" />
                    <span>Dados da Empresa</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/service-order-settings/sefaz")}
                    isActive={location.pathname === "/dashboard/service-order-settings/sefaz"}
                  >
                    <Building className="h-4 w-4" />
                    <span>SEFAZ</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/service-order-settings/area-cliente")}
                    isActive={location.pathname === "/dashboard/service-order-settings/area-cliente"}
                  >
                    <Users className="h-4 w-4" />
                    <span>Campos Página do Cliente</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard/service-order-settings/area-restrita-cliente-painel")}
                    isActive={location.pathname === "/dashboard/service-order-settings/area-restrita-cliente-painel"}
                  >
                    <Lock className="h-4 w-4" />
                    <span>Área Restrita do Cliente</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {hasPermission('all') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => navigate("/dashboard/admin/database-backup")}
                      isActive={location.pathname === "/dashboard/admin/database-backup"}
                    >
                      <Database className="h-4 w-4" />
                      <span>Backup do Banco</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      )}
    </>
  );
};
