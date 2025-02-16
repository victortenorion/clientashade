import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  valor_servicos: z.number(),
  base_calculo: z.number(),
  aliquota_iss: z.number(),
  valor_iss: z.number(),
  iss_retido: z.boolean(),
  codigo_servico: z.string(),
  discriminacao_servicos: z.string(),
});

export default function NFSeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const serviceOrderId = queryParams.get('service_order_id');

  // Fetch service order data if serviceOrderId is present
  const { data: serviceOrder } = useQuery({
    queryKey: ['service-order', serviceOrderId],
    queryFn: async () => {
      if (!serviceOrderId) return null;
      
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:client_id (
            id,
            name,
            document,
            email,
            phone,
            street,
            street_number,
            complement,
            neighborhood,
            city,
            state,
            zip_code
          )
        `)
        .eq('id', serviceOrderId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar ordem de serviço:', error);
        throw error;
      }

      return data;
    },
    enabled: !!serviceOrderId
  });

  // Pre-fill form with service order data when available
  useEffect(() => {
    if (serviceOrder) {
      form.reset({
        ...form.getValues(),
        valor_servicos: serviceOrder.total_price,
        base_calculo: serviceOrder.base_calculo || serviceOrder.total_price,
        aliquota_iss: serviceOrder.aliquota_iss || 0,
        valor_iss: serviceOrder.valor_iss || 0,
        iss_retido: serviceOrder.iss_retido || false,
        codigo_servico: serviceOrder.codigo_servico || '',
        discriminacao_servicos: serviceOrder.discriminacao_servico || ''
      });
    }
  }, [serviceOrder]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor_servicos: 0,
      base_calculo: 0,
      aliquota_iss: 0,
      valor_iss: 0,
      iss_retido: false,
      codigo_servico: "",
      discriminacao_servicos: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Lógica para salvar os dados da NFS-e
      console.log("Dados do formulário:", values);
      toast({
        title: "Sucesso!",
        description: "NFS-e gerada com sucesso.",
      });
      navigate("/dashboard/nfse");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Nota Fiscal de Serviço Eletrônica (NFS-e)</CardTitle>
          <CardDescription>Preencha os dados abaixo para gerar a NFS-e.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor_servicos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor dos Serviços</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="base_calculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base de Cálculo</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="aliquota_iss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alíquota ISS (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor_iss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor ISS</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="iss_retido"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-0.5 leading-none">
                      <FormLabel>ISS Retido</FormLabel>
                      <FormDescription>Marque se o ISS é retido na fonte.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo_servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Serviço</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ex: 14.05" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="discriminacao_servicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discriminação dos Serviços</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os serviços prestados"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                Gerar NFS-e
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
