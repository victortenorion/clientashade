import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Send, MessageCircleReply, Eye, Trash2, Database } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  message: string;
  created_at: string;
  is_from_client: boolean;
  read: boolean;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentMessages();
    fetchClients();

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
            is_from_client: false,
            read: true
          }
        ]);

      if (error) throw error;

      setNewMessage("");
      setReplyingTo(null);
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

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('client_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Mensagem excluída",
        description: "A mensagem foi excluída com sucesso.",
      });

      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir mensagem",
        description: "Não foi possível excluir a mensagem.",
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('client_messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Mensagem marcada como lida",
        description: "A mensagem foi marcada como lida com sucesso.",
      });

      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      toast({
        variant: "destructive",
        title: "Erro ao marcar como lida",
        description: "Não foi possível marcar a mensagem como lida.",
      });
    }
  };

  const handleReply = (message: Message) => {
    setSelectedClientId(message.client_id);
    setReplyingTo(message.id);
    setNewMessage(`Em resposta à mensagem: "${message.message}"\n\n`);
  };

  const handleMessageClick = (message: Message) => {
    if (message.is_from_client) {
      setSelectedClientId(message.client_id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">Bem-vindo ao Dashboard!</h2>
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard/admin/database-backup")}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Backup do Banco
        </Button>
      </div>
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
                  onClick={() => handleMessageClick(message)}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 cursor-pointer transition-colors ${
                      message.is_from_client
                        ? message.client_id === selectedClientId
                          ? "bg-purple-100 dark:bg-purple-900"
                          : "bg-muted hover:bg-purple-50 dark:hover:bg-purple-900/50"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      {message.is_from_client && (
                        <p className="text-xs font-medium">
                          {message.client.name}
                        </p>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs opacity-70">
                          {format(new Date(message.created_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {message.is_from_client && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReply(message);
                                }}
                                className="h-6 w-6"
                              >
                                <MessageCircleReply className="h-4 w-4" />
                              </Button>
                              {!message.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(message.id);
                                  }}
                                  className="h-6 w-6"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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
                placeholder={
                  replyingTo
                    ? "Digite sua resposta..."
                    : "Digite sua mensagem..."
                }
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
