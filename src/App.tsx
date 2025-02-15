import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/dashboard/Clients";
import ClientNew from "./pages/dashboard/ClientNew";
import ClientEdit from "./pages/dashboard/ClientEdit";
import Products from "./pages/dashboard/Products";
import ProductNew from "./pages/dashboard/ProductNew";
import ProductEdit from "./pages/dashboard/ProductEdit";
import ServiceOrders from "./pages/dashboard/ServiceOrders";
import ServiceOrderNew from "./pages/dashboard/ServiceOrderNew";
import ServiceOrderEdit from "./pages/dashboard/ServiceOrderEdit";
import ServiceOrderSettings from "./pages/dashboard/ServiceOrderSettings";
import ServiceOrderStatusSettings from "./pages/dashboard/ServiceOrderStatusSettings";
import ServiceOrderCompanyInfoSettings from "./pages/dashboard/ServiceOrderCompanyInfoSettings";
import ServiceOrderSefazSettings from "./pages/dashboard/ServiceOrderSefazSettings";
import ServiceOrderClientPageSettings from "./pages/dashboard/ServiceOrderClientPageSettings";
import ServiceOrderNFSettings from "./pages/dashboard/ServiceOrderNFSettings";
import Users from "./pages/dashboard/Users";
import UserNew from "./pages/dashboard/UserNew";
import UserEdit from "./pages/dashboard/UserEdit";
import Stores from "./pages/dashboard/Stores";
import StoreNew from "./pages/dashboard/StoreNew";
import StoreEdit from "./pages/dashboard/StoreEdit";
import NFCE from "./pages/dashboard/NFCE";
import NFSe from "./pages/dashboard/NFSe";
import NFSeFromServiceOrder from "./pages/dashboard/NFSeFromServiceOrder";
import NFSeForm from "./pages/dashboard/components/NFSeForm";

function App() {
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
        <Route path="clients/new" element={<ClientNew />} />
        <Route path="clients/:id/edit" element={<ClientEdit />} />

        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductNew />} />
        <Route path="products/:id/edit" element={<ProductEdit />} />

        <Route path="service-orders" element={<ServiceOrders />} />
        <Route path="service-orders/new" element={<ServiceOrderNew />} />
        <Route path="service-orders/:id/edit" element={<ServiceOrderEdit />} />
        <Route path="service-orders/:id/nfse" element={<NFSeFromServiceOrder />} />
        <Route path="nfse/new" element={<NFSeForm />} />

        <Route path="users" element={<Users />} />
        <Route path="users/new" element={<UserNew />} />
        <Route path="users/:id/edit" element={<UserEdit />} />

        <Route path="stores" element={<Stores />} />
        <Route path="stores/new" element={<StoreNew />} />
        <Route path="stores/:id/edit" element={<StoreEdit />} />

        <Route path="nfce" element={<NFCE />} />
        <Route path="nfse" element={<NFSe />} />

        <Route path="service-order-settings" element={<ServiceOrderSettings />} />
        <Route path="service-order-settings/status" element={<ServiceOrderStatusSettings />} />
        <Route path="service-order-settings/dados-empresa" element={<ServiceOrderCompanyInfoSettings />} />
        <Route path="service-order-settings/sefaz" element={<ServiceOrderSefazSettings />} />
        <Route path="service-order-settings/area-cliente" element={<ServiceOrderClientPageSettings />} />
        <Route path="service-order-settings/notas-fiscais" element={<ServiceOrderNFSettings />} />
      </Route>
    </Routes>
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
