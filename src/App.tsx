
import { Routes, Route } from "react-router-dom";
import { useLicenseCheck } from "@/hooks/useLicenseCheck";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import LicenseRequired from "@/pages/LicenseRequired";
import LicenseExpired from "@/pages/LicenseExpired";
import ClientLogin from "@/pages/ClientLogin";
import "./App.css";

function App() {
  const { isLicenseValid, loading } = useLicenseCheck();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isLicenseValid) {
    return (
      <Routes>
        <Route path="/license-required" element={<LicenseRequired />} />
        <Route path="/license-expired" element={<LicenseExpired />} />
        <Route path="*" element={<LicenseRequired />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </>
  );
}

export default App;
