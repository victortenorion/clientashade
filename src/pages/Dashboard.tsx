
import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  User,
  Package,
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  UserCircle,
  Settings,
  Store,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cadastrosOpen, setCadastrosOpen] = useState(true);
  const [ordensOpen, setOrdensOpen] = useState(true);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Tente novamente em alguns instantes.",
      });
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-background flex">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-xl font-bold p-4">Sistema</h2>
          </SidebarHeader>
          <SidebarContent>
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

            <SidebarGroup>
              <SidebarGroupLabel onClick={() => setCadastrosOpen(!cadastrosOpen)} className="cursor-pointer hover:bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>Cadastros</span>
                </div>
              </SidebarGroupLabel>
              {cadastrosOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/clients")}
                        isActive={location.pathname.startsWith("/dashboard/clients")}
                      >
                        <Users className="h-4 w-4" />
                        <span>Clientes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/users")}
                        isActive={location.pathname.startsWith("/dashboard/users")}
                      >
                        <User className="h-4 w-4" />
                        <span>Usuários</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/products")}
                        isActive={location.pathname.startsWith("/dashboard/products")}
                      >
                        <Package className="h-4 w-4" />
                        <span>Produtos</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/stores")}
                        isActive={location.pathname.startsWith("/dashboard/stores")}
                      >
                        <Store className="h-4 w-4" />
                        <span>Lojas</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel onClick={() => setOrdensOpen(!ordensOpen)} className="cursor-pointer hover:bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  <span>Ordem de Serviço</span>
                </div>
              </SidebarGroupLabel>
              {ordensOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/service-orders")}
                        isActive={location.pathname === "/dashboard/service-orders"}
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span>Listar Ordens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/service-order-settings")}
                        isActive={location.pathname === "/dashboard/service-order-settings"}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Configurações</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/customer-area")}
                        isActive={location.pathname === "/dashboard/customer-area"}
                      >
                        <UserCircle className="h-4 w-4" />
                        <span>Área do Cliente</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="p-4 flex justify-between items-center border-b">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </header>
          <main className="p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
