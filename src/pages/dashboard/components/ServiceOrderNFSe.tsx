import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

export const ServiceOrderNFSe = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [serviceCode, setServiceCode] = useState("");
  const [cnae, setCnae] = useState("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  useEffect(() => {
    const loadFiscalConfig = async () => {
      const { data: fiscalData, error: fiscalError } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'general')
        .single();

      if (fiscalError) {
        console.error('Erro ao carregar configurações fiscais:', fiscalError);
        return;
      }

      if (fiscalData?.config) {
        const config = fiscalData.config as { service_code: string; cnae: string };
        setServiceCode(config.service_code || '');
        setCnae(config.cnae || '');
      }
    };

    loadFiscalConfig();
  }, []);

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Emitir NFS-e</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceCode">Código de Serviço</Label>
              <Input id="serviceCode" value={serviceCode} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE</Label>
              <Input id="cnae" value={cnae} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data de Emissão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição dos Serviços</Label>
              <Textarea id="description" placeholder="Detalhe os serviços prestados" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Total dos Serviços</Label>
              <Input id="amount" type="number" placeholder="Informe o valor total" />
            </div>
            <Button onClick={() => toast({
              title: "Sucesso",
              description: "NFS-e emitida com sucesso!",
            })}>Emitir NFS-e</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
