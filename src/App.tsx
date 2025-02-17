
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Products from "@/pages/dashboard/Products";
import ServiceOrders from "@/pages/dashboard/ServiceOrders";
import ServiceOrderSettings from "@/pages/dashboard/ServiceOrderSettings";
import ServiceOrderForm from "@/pages/dashboard/ServiceOrderForm";
import ServiceOrderEdit from "@/pages/dashboard/ServiceOrderEdit";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
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
              <Route path="service-orders/:id" element={<ServiceOrderEdit />} />
              <Route path="service-order-settings/*" element={<ServiceOrderSettings />} />
              <Route path="nfce" element={<NFCe />} />
              <Route path="nfce/new" element={<NFCeForm />} />
              <Route path="nfse" element={<NFSe />} />
              <Route path="nfse/new" element={<NFSeForm />} />
              <Route path="users" element={<Users />} />
              <Route path="clients" element={<Clients />} />
              <Route path="stores" element={<Stores />} />
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
