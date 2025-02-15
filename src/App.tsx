
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
import { supabase } from "@/lib/supabase";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/dashboard/Clients";
import ServiceOrders from "./pages/dashboard/ServiceOrders";
import { NFSeStandalone } from "./pages/dashboard/NFSeStandalone";
import NFSeFromServiceOrder from "./pages/dashboard/NFSeFromServiceOrder";
import { ClientTab } from "./pages/dashboard/components/ClientTab";

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
        <Route path="service-order-settings/area-cliente" element={<ClientTab />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <Router>
        <AppRoutes />
      </Router>
    </SessionContextProvider>
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
