
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusTab } from "./components/StatusTab";
import { CompanyInfoTab } from "./components/CompanyInfoTab";
import { DBTab } from "./components/DBTab";
import { SEFAZTab } from "./components/SEFAZTab";
import { useState } from "react";

export default function ServiceOrderSettings() {
  const [nfceConfig, setNfceConfig] = useState(null);
  const [nfseConfig, setNfseConfig] = useState(null);
  const [fiscalConfig, setFiscalConfig] = useState(null);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-2xl font-medium">Configurações</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações da ordem de serviço
        </p>
      </div>
      
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="company">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="sefaz">SEFAZ</TabsTrigger>
          <TabsTrigger value="db">DB</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status">
          <StatusTab />
        </TabsContent>
        
        <TabsContent value="company">
          <CompanyInfoTab />
        </TabsContent>
        
        <TabsContent value="sefaz">
          <SEFAZTab 
            nfceConfig={nfceConfig}
            nfseConfig={nfseConfig}
            fiscalConfig={fiscalConfig}
            setNfceConfig={setNfceConfig}
            setNfseConfig={setNfseConfig}
            setFiscalConfig={setFiscalConfig}
          />
        </TabsContent>

        <TabsContent value="db">
          <DBTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
