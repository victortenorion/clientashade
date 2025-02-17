
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  message: string;
  is_from_client: boolean;
  created_at: string;
  read: boolean;
  client_id: string;
  client: {
    name: string;
  }
}

interface Client {
  id: string;
  name: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchMessages();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_messages'
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
      if (data && data.length > 0 && !selectedClient) {
        setSelectedClient(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('client_messages')
        .select(`
          *,
          client:clients(name)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar as mensagens.",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedClient) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_messages')
        .insert([
          {
            client_id: selectedClient,
            message: newMessage.trim(),
            is_from_client: false
          }
        ]);

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const clientMessages = messages.filter(m => m.client_id === selectedClient);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Mensagens dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {/* Lista de Clientes */}
            <div className="space-y-4">
              <h3 className="font-medium mb-2">Clientes</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {clients.map((client) => (
                    <Button
                      key={client.id}
                      variant={selectedClient === client.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedClient(client.id)}
                    >
                      {client.name}
                      {messages.filter(m => m.client_id === client.id && !m.read && m.is_from_client).length > 0 && (
                        <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 py-1 text-xs">
                          Novo
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Área de Mensagens */}
            <div className="col-span-3 space-y-4">
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {clientMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.is_from_client ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.is_from_client
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="mt-1 text-xs opacity-70">
                          {format(new Date(message.created_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[100px]"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim() || !selectedClient}
                  className="self-end"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
