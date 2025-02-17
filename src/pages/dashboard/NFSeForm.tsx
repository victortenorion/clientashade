
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
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  tipo_rnps: z.string().default('RPS'),
  operacao: z.string().default('A'),
  tributacao_rps: z.string().default('T'),
  status_rps: z.string().default('1'),
  valor_servicos: z.number().min(0),
  valor_deducoes: z.number().min(0),
  valor_pis: z.number().min(0),
  valor_cofins: z.number().min(0),
  valor_inss: z.number().min(0),
  valor_ir: z.number().min(0),
  valor_csll: z.number().min(0),
  codigo_atividade: z.string(),
  aliquota_servicos: z.number().min(0),
  tipo_recolhimento: z.string().default('A'),
  codigo_municipio_prestacao: z.string().optional(),
  cidade_prestacao: z.string().optional(),
  discriminacao_servicos: z.string(),
  iss_retido: z.boolean(),
  natureza_operacao: z.string().default('1'),
  optante_simples_nacional: z.boolean().default(false),
  incentivador_cultural: z.boolean().default(false),
  regime_especial_tributacao: z.string().optional(),
  item_lista_servico: z.string().optional(),
  codigo_tributacao_municipio: z.string().optional(),
  valor_outras_deducoes: z.number().min(0).optional(),
  valor_desconto_incondicionado: z.number().min(0).optional(),
  valor_desconto_condicionado: z.number().min(0).optional(),
  valor_outras_retencoes: z.number().min(0).optional(),
  outras_observacoes: z
  .string()
  .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NFSeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const serviceOrderId = queryParams.get('service_order_id');

  // Buscar dados da ordem de serviço e do cliente
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
            zip_code,
            tipo_documento,
            inscricao_municipal,
            regime_tributario,
            regime_especial,
            iss_retido,
            inss_retido,
            ir_retido,
            pis_cofins_csll_retido,
            codigo_municipio,
            incentivador_cultural
          )
        `)
        .eq('id', serviceOrderId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceOrderId
  });

  // Buscar configurações da empresa
  const { data: companyConfig } = useQuery({
    queryKey: ['company-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_rnps: 'RPS',
      operacao: 'A',
      tributacao_rps: 'T',
      status_rps: '1',
      valor_servicos: 0,
      valor_deducoes: 0,
      valor_pis: 0,
      valor_cofins: 0,
      valor_inss: 0,
      valor_ir: 0,
      valor_csll: 0,
      codigo_atividade: "",
      aliquota_servicos: 0,
      tipo_recolhimento: 'A',
      codigo_municipio_prestacao: "",
      cidade_prestacao: "",
      discriminacao_servicos: "",
      iss_retido: false,
      natureza_operacao: '1',
      optante_simples_nacional: false,
      incentivador_cultural: false,
    },
  });

  // Atualizar form quando os dados forem carregados
  useEffect(() => {
    if (serviceOrder && companyConfig) {
      form.reset({
        ...form.getValues(),
        valor_servicos: serviceOrder.total_price || 0,
        discriminacao_servicos: serviceOrder.discriminacao_servico || '',
        iss_retido: serviceOrder.client?.iss_retido || false,
        codigo_atividade: serviceOrder.codigo_servico || companyConfig.codigo_servico || '',
        aliquota_servicos: serviceOrder.aliquota_iss || 0,
        valor_deducoes: serviceOrder.valor_deducoes || 0,
        valor_pis: serviceOrder.valor_pis || 0,
        valor_cofins: serviceOrder.valor_cofins || 0,
        valor_inss: serviceOrder.valor_inss || 0,
        valor_ir: serviceOrder.valor_ir || 0,
        valor_csll: serviceOrder.valor_csll || 0,
        codigo_municipio_prestacao: serviceOrder.codigo_municipio_prestacao || companyConfig.endereco_codigo_municipio || '',
        cidade_prestacao: serviceOrder.cidade_prestacao || companyConfig.endereco_cidade || '',
        natureza_operacao: companyConfig.tipo_servico || '1',
        optante_simples_nacional: companyConfig.regime_tributario === 'simples',
        incentivador_cultural: serviceOrder.client?.incentivador_cultural || false,
        regime_especial_tributacao: serviceOrder.client?.regime_especial || '',
      });
    }
  }, [serviceOrder, companyConfig]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    const numericValue = parseFloat(value.replace(',', '.')) || 0;
    field.onChange(numericValue);
  };

  async function onSubmit(values: FormValues) {
    if (!serviceOrder?.client_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Cliente não encontrado",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Criar a NFS-e no banco
      const { data: nfse, error: nfseError } = await supabase
        .from('nfse')
        .insert({
          service_order_id: serviceOrderId,
          client_id: serviceOrder.client_id,
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
          status_sefaz: 'pendente',
          natureza_operacao: values.natureza_operacao,
          optante_simples_nacional: values.optante_simples_nacional,
          incentivador_cultural: values.incentivador_cultural,
          regime_especial_tributacao: values.regime_especial_tributacao,
          item_lista_servico: values.item_lista_servico,
          codigo_tributacao_municipio: values.codigo_tributacao_municipio,
          valor_outras_deducoes: values.valor_outras_deducoes,
          valor_desconto_incondicionado: values.valor_desconto_incondicionado,
          valor_desconto_condicionado: values.valor_desconto_condicionado,
          valor_outras_retencoes: values.valor_outras_retencoes,
          observacoes: values.outras_observacoes,
        })
        .select()
        .single();

      if (nfseError) throw nfseError;

      // Chamar a Edge Function para processar a NFS-e
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
                        <Input 
                          type="text" 
                          placeholder="0,00" 
                          value={field.value.toString().replace('.', ',')}
                          onChange={(e) => handleValueChange(e, field)}
                        />
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
                        <Input 
                          type="text" 
                          placeholder="0,00" 
                          value={field.value.toString().replace('.', ',')}
                          onChange={(e) => handleValueChange(e, field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['valor_deducoes', 'valor_pis', 'valor_cofins'].map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof FormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fieldName.split('_')[1].toUpperCase()}</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="0,00" 
                            value={field.value.toString().replace('.', ',')}
                            onChange={(e) => handleValueChange(e, field)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['valor_inss', 'valor_ir', 'valor_csll'].map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof FormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fieldName.split('_')[1].toUpperCase()}</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="0,00" 
                            value={field.value.toString().replace('.', ',')}
                            onChange={(e) => handleValueChange(e, field)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo_atividade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Serviço Municipal</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ex: 02178" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="item_lista_servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item da Lista de Serviços (LC 116)</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ex: 1.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="cidade_prestacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade da Prestação</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ex: São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="natureza_operacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Natureza da Operação</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Tributação no município</SelectItem>
                          <SelectItem value="2">2 - Tributação fora do município</SelectItem>
                          <SelectItem value="3">3 - Isenção</SelectItem>
                          <SelectItem value="4">4 - Imune</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="regime_especial_tributacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regime Especial</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Microempresa Municipal</SelectItem>
                          <SelectItem value="2">2 - Estimativa</SelectItem>
                          <SelectItem value="3">3 - Sociedade de Profissionais</SelectItem>
                          <SelectItem value="4">4 - Cooperativa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_recolhimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Recolhimento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A prazo</SelectItem>
                          <SelectItem value="R">Retido na Fonte</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          ISS será retido pelo tomador
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="optante_simples_nacional"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Optante Simples Nacional</FormLabel>
                        <FormDescription>
                          Empresa optante pelo Simples
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incentivador_cultural"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Incentivador Cultural</FormLabel>
                        <FormDescription>
                          Possui incentivo cultural
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <FormField
                control={form.control}
                name="discriminacao_servicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discriminação dos Serviços</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os serviços prestados"
                        className="resize-none h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outras_observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outras Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais"
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Gerando NFS-e..." : "Gerar NFS-e"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
