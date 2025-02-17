
import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarGroups } from "@/components/dashboard/SidebarGroups";
import { Header } from "@/components/dashboard/Header";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('sb-refresh-token');
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message || "Tente novamente em alguns instantes.",
      });
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
          console.log("Sessão não encontrada, redirecionando para /auth");
          navigate("/auth");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setUsername(profileData.username);
        }

        const { data: permissionsData, error: permissionsError } = await supabase
          .from("user_permissions")
          .select("menu_permission")
          .eq("user_id", session.user.id);

        if (permissionsError) throw permissionsError;

        if (permissionsData) {
          const permissions = permissionsData.map(p => p.menu_permission);
          console.log("Permissões do usuário:", permissions);
          setUserPermissions(permissions);
        }

        const { data: storeData, error: storeError } = await supabase
          .from("user_stores")
          .select("store_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (storeError) {
          console.error("Erro ao buscar loja do usuário:", storeError);
        } else if (storeData) {
          console.log("Loja do usuário:", storeData.store_id);
        }
      } catch (error: any) {
        console.error("Erro ao verificar sessão:", error);
        toast({
          variant: "destructive",
          title: "Erro ao verificar sessão",
          description: error.message,
        });
        navigate("/auth");
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('sb-refresh-token');
        navigate("/auth");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  console.log("Current location:", location.pathname);
  console.log("User permissions:", userPermissions);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-background flex w-full">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-xl font-bold p-4">Sistema</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroups userPermissions={userPermissions} />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header username={username} onLogout={handleLogout} />
          <main className="p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
