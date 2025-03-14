import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Products from "@/pages/dashboard/Products";
import ServiceOrders from "@/pages/dashboard/ServiceOrders";
import ServiceOrderSettings from "@/pages/dashboard/ServiceOrderSettings";
import ServiceOrderForm from "@/pages/dashboard/ServiceOrderForm";
import ServiceOrderEdit from "@/pages/dashboard/ServiceOrderEdit";
import ServiceOrderView from "@/pages/dashboard/ServiceOrderView";
import NFCe from "@/pages/dashboard/NFCe";
import NFCeForm from "@/pages/dashboard/NFCeForm";
import NFSe from "@/pages/dashboard/NFSe";
import NFSeForm from "@/pages/dashboard/NFSeForm";
import Users from "@/pages/dashboard/Users";
import Clients from "@/pages/dashboard/Clients";
import Stores from "@/pages/dashboard/Stores";
import Home from "@/pages/dashboard/Home";
import CustomerArea from "@/pages/dashboard/CustomerArea";
import CustomerServiceOrderView from "@/pages/dashboard/CustomerServiceOrderView";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";
import ClientLogin from "@/pages/ClientLogin";
import DatabaseBackup from "./pages/admin/DatabaseBackup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace={true} />} />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/auth/admin" element={<Auth />} />

        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="service-orders" element={<ServiceOrders />} />
          <Route path="service-orders/new" element={<ServiceOrderForm />} />
          <Route path="service-orders/:id" element={<ServiceOrderView />} />
          <Route path="service-orders/edit/:id" element={<ServiceOrderEdit />} />
          <Route path="service-order-settings/*" element={<ServiceOrderSettings />} />
          <Route path="nfce" element={<NFCe />} />
          <Route path="nfce/new" element={<NFCeForm />} />
          <Route path="nfse" element={<NFSe />} />
          <Route path="nfse/new" element={<NFSeForm />} />
          <Route path="nfse/:id" element={<NFSeForm />} />
          <Route path="users" element={<Users />} />
          <Route path="clients" element={<Clients />} />
          <Route path="stores" element={<Stores />} />
          <Route path="/admin/database-backup" element={<DatabaseBackup />} />
        </Route>

        <Route path="/client-login" element={<ClientLogin />} />
        <Route
          path="/customer-area/:clientId"
          element={
            <ClientProtectedRoute>
              <CustomerArea />
            </ClientProtectedRoute>
          }
        />
        <Route
          path="/customer-area/:clientId/service-orders/:orderId"
          element={
            <ClientProtectedRoute>
              <CustomerServiceOrderView />
            </ClientProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
