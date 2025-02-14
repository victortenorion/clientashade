
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusTab } from "./components/StatusTab";
import { useState } from "react";

const ServiceOrderSettings = () => {
  return (
    <Tabs defaultValue="status" className="space-y-6">
      <TabsList>
        <TabsTrigger value="status">Status</TabsTrigger>
      </TabsList>

      <TabsContent value="status">
        <StatusTab />
      </TabsContent>
    </Tabs>
  );
};

export default ServiceOrderSettings;
