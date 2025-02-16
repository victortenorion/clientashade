
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Dashboard from "@/pages/dashboard/Dashboard";
import { LoginForm } from "@/components/LoginForm";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/dashboard/Home";
import ServiceOrders from "@/pages/dashboard/ServiceOrders";
import ServiceOrderForm from "@/pages/dashboard/ServiceOrderForm";
import ServiceOrderEdit from "@/pages/dashboard/ServiceOrderEdit";
import ServiceOrderSettings from "@/pages/dashboard/ServiceOrderSettings";
import CustomerArea from "@/pages/dashboard/CustomerArea";
import NFCe from "@/pages/dashboard/NFCe";
import NFSeForm from "@/pages/dashboard/NFSeForm";
import NFCeForm from "@/pages/dashboard/NFCeForm";
import NFSe from "@/pages/dashboard/NFSe";
import Users from "@/pages/dashboard/Users";
import Clients from "@/pages/dashboard/Clients";
import Products from "@/pages/dashboard/Products";
import Stores from "@/pages/dashboard/Stores";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";
import { ClientLogin } from "@/pages/ClientLogin";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/client-login" element={<ClientLogin />} />
        <Route 
          path="/client-area/:clientId" 
          element={
            <ClientProtectedRoute>
              <CustomerArea />
            </ClientProtectedRoute>
          } 
        />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="users" element={<Users />} />
          <Route path="clients" element={<Clients />} />
          <Route path="products" element={<Products />} />
          <Route path="stores" element={<Stores />} />
          <Route path="service-orders" element={<ServiceOrders />} />
          <Route path="service-orders/new" element={<ServiceOrderForm />} />
          <Route path="service-orders/:id" element={<ServiceOrderEdit />} />
          <Route path="service-order-settings/*" element={<ServiceOrderSettings />} />
          <Route path="client-area" element={<CustomerArea />} />
          <Route path="nfce" element={<NFCe />} />
          <Route path="nfce/new" element={<NFCeForm />} />
          <Route path="nfse" element={<NFSe />} />
          <Route path="nfse/new" element={<NFSeForm />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
