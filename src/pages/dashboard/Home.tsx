
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  message: string;
  created_at: string;
  is_from_client: boolean;
  client: {
    name: string;
  }
  client_id: string;
}

interface Client {
  id: string;
  name: string;
}

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentMessages();
    fetchClients();

    // Inscrever para atualizações em tempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_messages'
        },
        () => {
          fetchRecentMessages();
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
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
      });
    }
  };

  const fetchRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('client_messages')
        .select(`
          *,
          client:clients(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar as mensagens recentes.",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedClientId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_messages')
        .insert([
          {
            client_id: selectedClientId,
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
      console.error('Erro ao enviar mensagem:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl">Bem-vindo ao Dashboard!</h2>
      <p className="mt-2 text-gray-600">
        Este é o seu painel de controle. Aqui você poderá acessar todas as funcionalidades do sistema.
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens Recentes
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {messages.map((message) => (
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
                    {message.is_from_client && (
                      <p className="text-xs font-medium mb-1">
                        {message.client.name}
                      </p>
                    )}
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
          
          <div className="flex gap-2 mt-4">
            <div className="flex-1 space-y-4">
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="min-h-[80px]"
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={loading || !newMessage.trim() || !selectedClientId}
              className="self-end"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
