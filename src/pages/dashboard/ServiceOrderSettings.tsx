
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerAreaTab } from "./components/CustomerAreaTab";
import { StatusTab } from "./components/StatusTab";
import { CustomerAreaSettings } from "./components/CustomerAreaSettings";

const ServiceOrderSettings = () => {
  return (
    <Tabs defaultValue="status" className="space-y-6">
      <TabsList>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="customer_area_fields">Campos da Área do Cliente</TabsTrigger>
        <TabsTrigger value="customer_area_settings">Configurações da Área do Cliente</TabsTrigger>
      </TabsList>

      <TabsContent value="status">
        <StatusTab />
      </TabsContent>

      <TabsContent value="customer_area_fields">
        <CustomerAreaTab 
          customerAreaFields={[]}
          onFieldVisibilityChange={() => {}}
        />
      </TabsContent>

      <TabsContent value="customer_area_settings">
        <CustomerAreaSettings />
      </TabsContent>
    </Tabs>
  );
};

export default ServiceOrderSettings;
