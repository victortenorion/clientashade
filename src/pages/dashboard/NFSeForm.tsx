
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  tipo_rnps: z.string().default('RPS'),
  operacao: z.string().default('A'),
  tributacao_rps: z.string().default('T'),
  status_rps: z.string().default('1'),
  valor_servicos: z.string().transform((val) => Number(val)),
  valor_deducoes: z.string().transform((val) => Number(val)),
  valor_pis: z.string().transform((val) => Number(val)),
  valor_cofins: z.string().transform((val) => Number(val)),
  valor_inss: z.string().transform((val) => Number(val)),
  valor_ir: z.string().transform((val) => Number(val)),
  valor_csll: z.string().transform((val) => Number(val)),
  codigo_atividade: z.string(),
  aliquota_servicos: z.string().transform((val) => Number(val)),
  tipo_recolhimento: z.string().default('A'),
  codigo_municipio_prestacao: z.string().optional(),
  cidade_prestacao: z.string().optional(),
  discriminacao_servicos: z.string(),
  iss_retido: z.boolean(),
});

export default function NFSeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const serviceOrderId = queryParams.get('service_order_id');

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_rnps: 'RPS',
      operacao: 'A',
      tributacao_rps: 'T',
      status_rps: '1',
      valor_servicos: "0",
      valor_deducoes: "0",
      valor_pis: "0",
      valor_cofins: "0",
      valor_inss: "0",
      valor_ir: "0",
      valor_csll: "0",
      codigo_atividade: "",
      aliquota_servicos: "0",
      tipo_recolhimento: 'A',
      codigo_municipio_prestacao: "",
      cidade_prestacao: "",
      discriminacao_servicos: "",
      iss_retido: false,
    },
  });

  useEffect(() => {
    if (serviceOrder) {
      form.reset({
        valor_servicos: String(serviceOrder.total_price || 0),
        discriminacao_servicos: serviceOrder.discriminacao_servico || '',
        iss_retido: serviceOrder.iss_retido || false,
        codigo_atividade: serviceOrder.codigo_servico || '',
        aliquota_servicos: String(serviceOrder.aliquota_iss || 0),
        valor_deducoes: "0",
        valor_pis: "0",
        valor_cofins: "0",
        valor_inss: "0",
        valor_ir: "0",
        valor_csll: "0",
        codigo_municipio_prestacao: serviceOrder.codigo_municipio_prestacao || '',
        cidade_prestacao: serviceOrder.cidade_prestacao || '',
      });
    }
  }, [serviceOrder]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Primeiro, criar a NFS-e no banco
      const { data: nfse, error: nfseError } = await supabase
        .from('nfse')
        .insert({
          service_order_id: serviceOrderId,
          client_id: serviceOrder?.client_id,
          valor_servicos: values.valor_servicos,
          valor_deducoes: values.valor_deducoes,
          valor_pis: values.valor_pis,
          valor_cofins: values.valor_cofins,
          valor_inss: values.valor_inss,
          valor_ir: values.valor_ir,
          valor_csll: values.valor_csll,
          codigo_atividade: values.codigo_atividade,
          aliquota_servicos: values.aliquota_servicos,
          tipo_recolhimento: values.tipo_recolhimento,
          codigo_municipio_prestacao: values.codigo_municipio_prestacao,
          cidade_prestacao: values.cidade_prestacao,
          discriminacao_servicos: values.discriminacao_servicos,
          iss_retido: values.iss_retido,
          status_sefaz: 'pendente'
        })
        .select()
        .single();

      if (nfseError) throw nfseError;

      // Agora, chamar a Edge Function para processar a NFS-e
      const { error: processError } = await supabase.functions.invoke('process-nfse', {
        body: { nfseId: nfse.id }
      });

      if (processError) throw processError;

      toast({
        title: "Sucesso!",
        description: "NFS-e enviada para processamento.",
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
          <CardTitle>Gerar NFS-e (Prefeitura de São Paulo)</CardTitle>
          <CardDescription>Preencha os dados para gerar a NFS-e.</CardDescription>
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
                        <Input type="text" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aliquota_servicos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alíquota (%)</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="valor_deducoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deduções</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor_pis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIS</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor_cofins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COFINS</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="valor_inss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>INSS</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor_ir"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IR</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor_csll"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSLL</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo_atividade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Serviço</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ex: 02178" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codigo_municipio_prestacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Município</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ex: 3550308" {...field} />
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>ISS Retido</FormLabel>
                      <FormDescription>
                        Marque esta opção se o ISS será retido pelo tomador
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

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
