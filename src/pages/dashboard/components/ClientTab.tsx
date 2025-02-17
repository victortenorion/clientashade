
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientBasicInfo } from "./ClientBasicInfo";
import { ClientAddress } from "./ClientAddress";
import { ClientContact } from "./ClientContact";
import { ClientAccess } from "./ClientAccess";
import { ClientStore } from "./ClientStore";
import MessagesTab from "./MessagesTab";
import { useState } from "react";

interface ClientTabProps {
  clientId: string;
}

export default function ClientTab({ clientId }: ClientTabProps) {
  const [formData, setFormData] = useState({
    // Adicione aqui os campos necessários para o formulário
    name: "",
    document: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    // ... outros campos necessários
  });

  const [searchingDocument, setSearchingDocument] = useState(false);
  const [stores, setStores] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleFormChange = (newData: any) => {
    setFormData({ ...formData, ...newData });
  };

  const handleSearchDocument = async () => {
    setSearchingDocument(true);
    // Implemente a lógica de busca de documento
    setSearchingDocument(false);
  };

  const handleCEPChange = async (cep: string) => {
    // Implemente a lógica de busca de CEP
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
        <TabsTrigger value="address">Endereço</TabsTrigger>
        <TabsTrigger value="contact">Contato</TabsTrigger>
        <TabsTrigger value="access">Acesso</TabsTrigger>
        <TabsTrigger value="store">Loja</TabsTrigger>
        <TabsTrigger value="messages">Mensagens</TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <ClientBasicInfo 
          formData={formData}
          onFormChange={handleFormChange}
          onSearchDocument={handleSearchDocument}
          searchingDocument={searchingDocument}
          editingId={editingId}
        />
      </TabsContent>

      <TabsContent value="address">
        <ClientAddress 
          formData={formData}
          onFormChange={handleFormChange}
          onCEPChange={handleCEPChange}
        />
      </TabsContent>

      <TabsContent value="contact">
        <ClientContact 
          formData={formData}
          onFormChange={handleFormChange}
        />
      </TabsContent>

      <TabsContent value="access">
        <ClientAccess 
          formData={formData}
          onFormChange={handleFormChange}
          editingId={editingId}
        />
      </TabsContent>

      <TabsContent value="store">
        <ClientStore 
          formData={formData}
          stores={stores}
          onFormChange={handleFormChange}
        />
      </TabsContent>

      <TabsContent value="messages">
        <MessagesTab />
      </TabsContent>
    </Tabs>
  );
}
