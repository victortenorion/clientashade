import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NFSeSPSettings } from "./NFSeSPSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <Card>
            <CardHeader>
              <CardTitle>Certificado Digital</CardTitle>
              <CardDescription>
                Configure o certificado digital para comunicação com a SEFAZ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Arquivo do Certificado
                    </label>
                    <input
                      type="file"
                      className="mt-1 block w-full"
                      accept=".pfx,.p12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Senha do Certificado
                    </label>
                    <input
                      type="password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Validade
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    O certificado é válido até: DD/MM/AAAA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos">
          <Card>
            <CardHeader>
              <CardTitle>Códigos de Serviço</CardTitle>
              <CardDescription>
                Configure os códigos de serviço utilizados nas notas fiscais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Código de Serviço Principal
                  </label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option>Selecione um código</option>
                    <option value="1.01">1.01 - Análise e desenvolvimento de sistemas</option>
                    <option value="1.02">1.02 - Programação</option>
                    <option value="1.03">1.03 - Processamento de dados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CNAE
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Ex: 6201-5/00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
