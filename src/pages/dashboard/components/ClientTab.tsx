
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientBasicInfo } from "./ClientBasicInfo";
import { ClientAddress } from "./ClientAddress";
import { ClientContact } from "./ClientContact";
import { ClientAccess } from "./ClientAccess";
import { ClientStore } from "./ClientStore";
import MessagesTab from "./MessagesTab";

interface ClientTabProps {
  clientId: string;
}

export default function ClientTab({ clientId }: ClientTabProps) {
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
        <ClientBasicInfo />
      </TabsContent>

      <TabsContent value="address">
        <ClientAddress />
      </TabsContent>

      <TabsContent value="contact">
        <ClientContact />
      </TabsContent>

      <TabsContent value="access">
        <ClientAccess />
      </TabsContent>

      <TabsContent value="store">
        <ClientStore />
      </TabsContent>

      <TabsContent value="messages">
        <MessagesTab />
      </TabsContent>
    </Tabs>
  );
}
