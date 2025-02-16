
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NFSeSPSettings } from "./NFSeSPSettings";
import { CertificadoDigitalSettings } from "./CertificadoDigitalSettings";
import { ServiceCodesSettings } from "./ServiceCodesSettings";

interface SEFAZTabProps {
  nfceConfig: any;
  nfseConfig: any;
  fiscalConfig: any;
  setNfceConfig: (config: any) => void;
  setNfseConfig: (config: any) => void;
  setFiscalConfig: (config: any) => void;
  handleSaveAllConfigs: () => Promise<void>;
}

export function SEFAZTab(props: SEFAZTabProps) {
  const [activeTab, setActiveTab] = useState("nfse-sp");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações SEFAZ</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações de comunicação com a SEFAZ
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="nfse-sp">NFS-e São Paulo</TabsTrigger>
          <TabsTrigger value="certificado">Certificado Digital</TabsTrigger>
          <TabsTrigger value="servicos">Códigos de Serviço</TabsTrigger>
        </TabsList>

        <TabsContent value="nfse-sp" className="space-y-4">
          <NFSeSPSettings />
        </TabsContent>

        <TabsContent value="certificado">
          <CertificadoDigitalSettings />
        </TabsContent>

        <TabsContent value="servicos">
          <ServiceCodesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
