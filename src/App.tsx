
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Home from "./pages/dashboard/Home";
import Clients from "./pages/dashboard/Clients";
import Products from "./pages/dashboard/Products";
import Users from "./pages/dashboard/Users";
import Stores from "./pages/dashboard/Stores";
import NFCe from "./pages/dashboard/NFCe";
import NFSe from "./pages/dashboard/NFSe";
import ServiceOrders from "./pages/dashboard/ServiceOrders";
import ServiceOrderForm from "./pages/dashboard/ServiceOrderForm";
import ServiceOrderEdit from "./pages/dashboard/ServiceOrderEdit";
import ServiceOrderSettings from "./pages/dashboard/ServiceOrderSettings";
import CustomerArea from "./pages/dashboard/CustomerArea";
import ClientProtectedRoute from "./components/ClientProtectedRoute";
import NotFound from "./pages/NotFound";
import ClientLogin from "./pages/ClientLogin";
import { Toaster } from "./components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cliente/login" element={<ClientLogin />} />
          <Route path="/cliente/*" element={<ClientProtectedRoute />}>
            <Route path="area" element={<CustomerArea />} />
          </Route>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Home />} />
            <Route path="clients" element={<Clients />} />
            <Route path="users" element={<Users />} />
            <Route path="products" element={<Products />} />
            <Route path="stores" element={<Stores />} />
            <Route path="nfce" element={<NFCe />} />
            <Route path="nfse" element={<NFSe />} />
            <Route path="service-orders" element={<ServiceOrders />} />
            <Route path="service-orders/create" element={<ServiceOrderForm />} />
            <Route path="service-orders/:id/edit" element={<ServiceOrderEdit />} />
            <Route path="service-order-settings/*" element={<ServiceOrderSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
