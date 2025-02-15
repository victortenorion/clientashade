
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSession, useSupabaseClient, SessionContextProvider } from "@supabase/auth-helpers-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/dashboard/Clients";
import ServiceOrders from "./pages/dashboard/ServiceOrders";
import { NFSeStandalone } from "./pages/dashboard/NFSeStandalone";
import NFSeFromServiceOrder from "./pages/dashboard/NFSeFromServiceOrder";
import { ClientTab } from "./pages/dashboard/components/ClientTab";
import { NotasFiscaisTab } from "./pages/dashboard/components/NotasFiscaisTab";
import NFSePage from "./pages/dashboard/NFSe";
import Stores from "./pages/dashboard/Stores";
import { SEFAZTab } from "./pages/dashboard/components/SEFAZTab";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<Dashboard />}>
        <Route path="clients" element={<Clients />} />
        <Route path="service-orders" element={<ServiceOrders />} />
        <Route path="service-orders/:id/nfse" element={<NFSeFromServiceOrder />} />
        <Route path="nfse/new" element={<NFSeStandalone />} />
        <Route path="nfse" element={<NFSePage />} />
        <Route path="stores" element={<Stores />} />
        <Route path="service-order-settings/area-cliente" element={<ClientTab />} />
        <Route path="service-order-settings/notas-fiscais" element={<NotasFiscaisTab />} />
        <Route path="service-order-settings/sefaz" element={<SEFAZTab />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
        <Router>
          <AppRoutes />
        </Router>
      </SessionContextProvider>
    </QueryClientProvider>
  );
}

function LoginPage() {
  const session = useSession();
  const supabaseClient = useSupabaseClient();

  if (session) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="container mx-auto py-8">
      <Auth
        supabaseClient={supabaseClient}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']}
        redirectTo={`${window.location.origin}/dashboard`}
      />
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const session = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default App;
