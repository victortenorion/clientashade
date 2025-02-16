
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/Home";
import Clients from "./pages/dashboard/Clients";
import Products from "./pages/dashboard/Products";
import Users from "./pages/dashboard/Users";
import Stores from "./pages/dashboard/Stores";
import ServiceOrderForm from "./pages/dashboard/ServiceOrderForm";
import ServiceOrderSettings from "./pages/dashboard/ServiceOrderSettings";
import CustomerArea from "./pages/dashboard/CustomerArea";
import NFCe from "./pages/dashboard/NFCe";
import NFSe from "./pages/dashboard/NFSe";
import NotFound from "./pages/NotFound";
import ClientLogin from "./pages/ClientLogin";
import { LoginForm } from "./components/LoginForm";
import { ClientProtectedRoute } from "./components/ClientProtectedRoute";
import { ServiceOrderDetails } from "./pages/dashboard/components/ServiceOrderDetails";

const queryClient = new QueryClient();

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/client-login" element={<ClientLogin />} />
                <Route path="/auth" element={<LoginForm />} />
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="products" element={<Products />} />
                  <Route path="users" element={<Users />} />
                  <Route path="stores" element={<Stores />} />
                  <Route path="service-orders/create" element={<ServiceOrderForm />} />
                  <Route path="service-orders/:id" element={<ServiceOrderDetails />} />
                  <Route path="service-order-settings/*" element={<ServiceOrderSettings />} />
                  <Route path="customer-area" element={<CustomerArea />} />
                  <Route path="nfce" element={<NFCe />} />
                  <Route path="nfse" element={<NFSe />} />
                </Route>
                <Route 
                  path="/customer-area" 
                  element={
                    <ClientProtectedRoute>
                      <CustomerArea />
                    </ClientProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
