
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerAreaTab } from "./components/CustomerAreaTab";
import { StatusTab } from "./components/StatusTab";
import { CustomerAreaSettingsForm } from "./components/CustomerAreaSettingsForm";
import { useState } from "react";

const ServiceOrderSettings = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSaveStatus = async (status: any) => {
    // Implementar lógica de salvamento
  };

  const handleDeleteStatus = async (id: string) => {
    // Implementar lógica de deleção
  };

  return (
    <Tabs defaultValue="status" className="space-y-6">
      <TabsList>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="customer_area_fields">Campos da Área do Cliente</TabsTrigger>
        <TabsTrigger value="customer_area_settings">Configurações da Área do Cliente</TabsTrigger>
      </TabsList>

      <TabsContent value="status">
        <StatusTab 
          statuses={statuses}
          loading={loading}
          onSave={handleSaveStatus}
          onDelete={handleDeleteStatus}
        />
      </TabsContent>

      <TabsContent value="customer_area_fields">
        <CustomerAreaTab 
          customerAreaFields={[]}
          onFieldVisibilityChange={() => {}}
        />
      </TabsContent>

      <TabsContent value="customer_area_settings">
        <CustomerAreaSettingsForm />
      </TabsContent>
    </Tabs>
  );
};

export default ServiceOrderSettings;
