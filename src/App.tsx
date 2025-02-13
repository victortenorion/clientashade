
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
import ServiceOrders from "./pages/dashboard/ServiceOrders";
import CustomerArea from "./pages/dashboard/CustomerArea";
import NotFound from "./pages/NotFound";

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
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="products" element={<Products />} />
                  <Route path="users" element={<Users />} />
                  <Route path="service-orders" element={<ServiceOrders />} />
                  <Route path="customer-area" element={<CustomerArea />} />
                </Route>
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
