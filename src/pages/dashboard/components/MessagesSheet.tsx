
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, MessageCircleReply, Eye } from "lucide-react";

interface MessagesSheetProps {
  clientId: string;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  is_from_client: boolean;
  read: boolean;
}

export function MessagesSheet({ clientId }: MessagesSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();

    // Inscrever para atualizações em tempo real
    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar as mensagens.",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_messages')
        .insert([
          {
            client_id: clientId,
            message: newMessage.trim(),
            is_from_client: false
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

      fetchMessages();
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      toast({
        variant: "destructive",
        title: "Erro ao marcar como lida",
        description: "Não foi possível marcar a mensagem como lida.",
      });
    }
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    // Encontrar a mensagem e focar no textarea
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setNewMessage(`Em resposta à mensagem: "${message.message}"\n\n`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.is_from_client ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.is_from_client
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <p className="text-sm">{message.message}</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-xs opacity-70">
                      {format(new Date(message.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    {message.is_from_client && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReply(message.id)}
                          className="h-6 px-2"
                        >
                          <MessageCircleReply className="h-4 w-4" />
                        </Button>
                        {!message.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(message.id)}
                            className="h-6 px-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex gap-2 mt-4 pt-4 border-t">
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
        <Button
          onClick={sendMessage}
          disabled={loading || !newMessage.trim()}
          className="self-end"
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar
        </Button>
      </div>
    </div>
  );
}
