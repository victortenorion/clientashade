
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface Message {
  id: string;
  message: string;
  is_from_client: boolean;
  created_at: string;
  read: boolean;
}

export default function MessagesTab() {
  const { clientId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
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
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar as mensagens. Tente novamente.",
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

  return (
    <div className="space-y-4">
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
