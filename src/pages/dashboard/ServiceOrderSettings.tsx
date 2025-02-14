
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { StatusTab } from "./components/StatusTab";
import { NotasFiscaisTab } from "./components/NotasFiscaisTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import PersonalizarTab from "./components/PersonalizarTab";

const ServiceOrderSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname.split("/").pop() || "status";

  const handleTabChange = (value: string) => {
    if (value === "status") {
      navigate("/dashboard/service-order-settings");
    } else {
      navigate(`/dashboard/service-order-settings/${value}`);
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="personalizar">Personalizar</TabsTrigger>
        <TabsTrigger value="notas-fiscais">Notas Fiscais</TabsTrigger>
        <TabsTrigger value="sefaz">SEFAZ</TabsTrigger>
        <TabsTrigger value="area-cliente">Área do Cliente</TabsTrigger>
      </TabsList>
      <TabsContent value="status">
        <StatusTab />
      </TabsContent>
      <TabsContent value="personalizar">
        <PersonalizarTab />
      </TabsContent>
      <TabsContent value="notas-fiscais">
        <NotasFiscaisTab />
      </TabsContent>
      <TabsContent value="sefaz">
        <SEFAZTab />
      </TabsContent>
      <TabsContent value="area-cliente">
        <ClientTab />
      </TabsContent>
    </Tabs>
  );
};

export default ServiceOrderSettings;
