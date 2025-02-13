
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
  Menu,
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
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menuPrincipalOpen, setMenuPrincipalOpen] = useState(true);

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
              <SidebarGroupLabel onClick={() => setMenuPrincipalOpen(!menuPrincipalOpen)} className="cursor-pointer hover:bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  <span>Menu Principal</span>
                </div>
              </SidebarGroupLabel>
              {menuPrincipalOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/menu1")}
                        isActive={location.pathname.startsWith("/dashboard/menu1")}
                      >
                        <Package className="h-4 w-4" />
                        <span>Menu 1</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/dashboard/menu2")}
                        isActive={location.pathname.startsWith("/dashboard/menu2")}
                      >
                        <Package className="h-4 w-4" />
                        <span>Menu 2</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>Cadastros</span>
                </div>
              </SidebarGroupLabel>
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
                </SidebarMenu>
              </SidebarGroupContent>
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
