import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
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

interface User {
  id: string;
  username: string;
  permissions?: string[];
  store_id?: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const hasAllPermissions = userPermissions.includes("all");

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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
          console.log("Sessão não encontrada, redirecionando para /auth");
          navigate("/auth");
          return;
        }

        if (session.refresh_token) {
          localStorage.setItem('sb-refresh-token', session.refresh_token);
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
      } else if (event === 'SIGNED_IN' && session) {
        if (session.refresh_token) {
          localStorage.setItem('sb-refresh-token', session.refresh_token);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

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
