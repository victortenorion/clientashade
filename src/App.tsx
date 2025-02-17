
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientLogin from "./pages/ClientLogin";
import CustomerArea from "./pages/dashboard/CustomerArea";
import CustomerServiceOrderView from "./pages/dashboard/CustomerServiceOrderView";
import { ClientProtectedRoute } from "./components/ClientProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
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
            path="/customer-area/:clientId/service-order/:orderId"
            element={
              <ClientProtectedRoute>
                <CustomerServiceOrderView />
              </ClientProtectedRoute>
            }
          />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </ThemeProvider>
    </Router>
  );
}

export default App;
