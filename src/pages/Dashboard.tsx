
import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  User as UserIcon,
  Package,
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  UserCircle,
  Settings,
  Store,
  ArrowLeft,
  Receipt,
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

interface User {
  id: string;
  username: string;
  permissions?: string[];
  store_id?: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cadastrosOpen, setCadastrosOpen] = useState(true);
  const [ordensOpen, setOrdensOpen] = useState(true);
  const [notasFiscaisOpen, setNotasFiscaisOpen] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const hasAllPermissions = userPermissions.includes("all");

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

  const handleBack = () => {
    navigate(-1);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${searchTerm}%`);

      if (profilesError) throw profilesError;

      if (!hasAllPermissions) {
        setUsers(profilesData || []);
        return;
      }

      const usersWithData = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const [permissionsData, storeData] = await Promise.all([
            supabase
              .from("user_permissions")
              .select("menu_permission")
              .eq("user_id", profile.id),
            supabase
              .from("user_stores")
              .select("store_id")
              .eq("user_id", profile.id)
              .maybeSingle()
          ]);

          const permissions = permissionsData.data?.map(p => p.menu_permission) || [];
          const store_id = storeData.data?.store_id || null;

          return {
            ...profile,
            permissions,
            store_id
          };
        })
      );

      setUsers(usersWithData);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      } else {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();

        if (!profileError && profileData) {
          setUsername(profileData.username);
        }

        const { data: permissionsData, error: permissionsError } = await supabase
          .from("user_permissions")
          .select("menu_permission")
          .eq("user_id", session.user.id);

        if (!permissionsError && permissionsData) {
          const permissions = permissionsData.map(p => p.menu_permission);
          console.log("Permissões do usuário:", permissions);
          setUserPermissions(permissions);
        }
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

  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission);
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-background flex">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-xl font-bold p-4">Sistema</h2>
          </SidebarHeader>
          <SidebarContent>
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
                          isActive={location.pathname.startsWith("/dashboard/clients")}
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
                          isActive={location.pathname.startsWith("/dashboard/users")}
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
                          isActive={location.pathname.startsWith("/dashboard/products")}
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
                          isActive={location.pathname.startsWith("/dashboard/stores")}
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
                          isActive={location.pathname === "/dashboard/service-orders"}
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span>Listar Ordens</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                    {hasPermission('service_order_settings') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => navigate("/dashboard/service-order-settings")}
                          isActive={location.pathname === "/dashboard/service-order-settings"}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Configurações</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                    {hasPermission('customer_area') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => navigate("/dashboard/customer-area")}
                          isActive={location.pathname === "/dashboard/customer-area"}
                        >
                          <UserCircle className="h-4 w-4" />
                          <span>Área do Cliente</span>
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
                          isActive={location.pathname === "/dashboard/nfce"}
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
                          isActive={location.pathname === "/dashboard/nfse"}
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
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="p-4 flex justify-between items-center border-b">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Olá, {username || "Usuário"}
              </span>
              <Button variant="outline" onClick={() => handleLogout()}>
                Sair
              </Button>
            </div>
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
