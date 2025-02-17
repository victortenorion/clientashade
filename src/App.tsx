
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ClientLogin } from "./pages/ClientLogin";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/dashboard/Home";
import Clients from "./pages/dashboard/Clients";
import Users from "./pages/dashboard/Users";
import Products from "./pages/dashboard/Products";
import ServiceOrders from "./pages/dashboard/ServiceOrders";
import ServiceOrderForm from "./pages/dashboard/ServiceOrderForm";
import ServiceOrderEdit from "./pages/dashboard/ServiceOrderEdit";
import ServiceOrderSettings from "./pages/dashboard/ServiceOrderSettings";
import NFCe from "./pages/dashboard/NFCe";
import NFCeForm from "./pages/dashboard/NFCeForm";
import NFSe from "./pages/dashboard/NFSe";
import NFSeForm from "./pages/dashboard/NFSeForm";
import CustomerArea from "./pages/dashboard/CustomerArea";
import Stores from "./pages/dashboard/Stores";
import { ClientProtectedRoute } from "./components/ClientProtectedRoute";
import { Toaster } from "./components/ui/toaster";
import Auth from "./pages/Auth";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Home />} />
            <Route path="clients" element={<Clients />} />
            <Route path="users" element={<Users />} />
            <Route path="products" element={<Products />} />
            <Route path="stores" element={<Stores />} />
            <Route path="service-orders" element={<ServiceOrders />} />
            <Route path="service-orders/new" element={<ServiceOrderForm />} />
            <Route path="service-orders/:id/edit" element={<ServiceOrderEdit />} />
            <Route path="service-orders/:id" element={<ServiceOrderEdit />} />
            <Route path="service-order-settings/*" element={<ServiceOrderSettings />} />
            <Route path="nfce" element={<NFCe />} />
            <Route path="nfce/new" element={<NFCeForm />} />
            <Route path="nfse" element={<NFSe />} />
            <Route path="nfse/new" element={<NFSeForm />} />
            <Route path="nfse/:id" element={<NFSeForm />} />
            <Route path="customer-area" element={<CustomerArea />} />
          </Route>
          <Route
            path="/customer-area/:clientId"
            element={
              <ClientProtectedRoute>
                <CustomerArea />
              </ClientProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
