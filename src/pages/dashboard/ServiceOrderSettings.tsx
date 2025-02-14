
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusTab } from "./components/StatusTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { ClientTab } from "./components/ClientTab";
import { useLocation } from "react-router-dom";

const ServiceOrderSettings = () => {
  const location = useLocation();
  const getDefaultTab = () => {
    if (location.pathname.includes("/sefaz")) return "sefaz";
    if (location.pathname.includes("/notas-fiscais")) return "notas-fiscais";
    if (location.pathname.includes("/area-cliente")) return "area-cliente";
    if (location.pathname.includes("/campos-visiveis")) return "campos-visiveis";
    return "status";
  };

  return (
    <Tabs defaultValue={getDefaultTab()} className="space-y-6">
      <TabsList>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="notas-fiscais">Notas Fiscais</TabsTrigger>
        <TabsTrigger value="sefaz">SEFAZ</TabsTrigger>
        <TabsTrigger value="area-cliente">Área do Cliente</TabsTrigger>
        <TabsTrigger value="campos-visiveis">Campos Visíveis</TabsTrigger>
      </TabsList>

      <TabsContent value="status">
        <StatusTab />
      </TabsContent>
      <TabsContent value="notas-fiscais">
        <SEFAZTab />
      </TabsContent>
      <TabsContent value="sefaz">
        <SEFAZTab />
      </TabsContent>
      <TabsContent value="area-cliente">
        <ClientTab />
      </TabsContent>
      <TabsContent value="campos-visiveis">
        <ClientTab />
      </TabsContent>
    </Tabs>
  );
};

export default ServiceOrderSettings;
