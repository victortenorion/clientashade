
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
import ServiceOrders from "./pages/dashboard/ServiceOrders";
import ServiceOrderSettings from "./pages/dashboard/ServiceOrderSettings";
import CustomerArea from "./pages/dashboard/CustomerArea";
import NotFound from "./pages/NotFound";
import ClientLogin from "./pages/ClientLogin";
import { LoginForm } from "./components/LoginForm";
import { ClientProtectedRoute } from "./components/ClientProtectedRoute";

const queryClient = new QueryClient();

const App: React.FC = () => {
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
                {/* Área administrativa */}
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="products" element={<Products />} />
                  <Route path="users" element={<Users />} />
                  <Route path="stores" element={<Stores />} />
                  <Route path="service-orders" element={<ServiceOrders />} />
                  <Route path="service-order-settings" element={<ServiceOrderSettings />} />
                  <Route path="customer-area" element={<CustomerArea />} />
                </Route>
                {/* Área do cliente separada do dashboard administrativo */}
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
};

export default App;
