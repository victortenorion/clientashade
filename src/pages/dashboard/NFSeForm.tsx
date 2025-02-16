import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { NFSeConfig } from "@/pages/dashboard/types/config.types";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, Form, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface ServiceOrder {
  id: string;
  client_id: string;
}

interface FiscalConfigData {
  id: string;
  type: string;
  config: NFSeConfig;
}

const formSchema = z.object({
  codigo_servico: z.string().min(2, {
    message: "Código do serviço deve ter pelo menos 2 caracteres.",
  }),
  discriminacao_servicos: z.string().min(10, {
    message: "Discriminação dos serviços deve ter pelo menos 10 caracteres.",
  }),
  servico_discriminacao_item: z.string().optional(),
  servico_codigo_item_lista: z.string().optional(),
  servico_codigo_municipio: z.string().optional(),
  servico_codigo_local_prestacao: z.string().optional(),
  servico_valor_item: z.string().optional(),
  servico_exigibilidade: z.string().optional(),
  servico_operacao: z.string().optional(),
  valor_servicos: z.string().optional(),
  base_calculo: z.string().optional(),
  aliquota_iss: z.string().optional(),
  valor_iss: z.string().optional(),
  iss_retido: z.boolean().default(false),
  regime_especial_tributacao: z.string().optional(),
  tipo_regime_especial: z.string().optional(),
  operacao_tributacao: z.string().optional(),
  optante_simples_nacional: z.boolean().default(false),
  incentivador_cultural: z.boolean().default(false),
  tipo_tributacao: z.string().optional(),
  tipo_rps: z.string().optional(),
  serie_rps: z.string().optional(),
});

type NFSeFormData = z.infer<typeof formSchema>

export default function NFSeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { serviceOrderId } = useParams();

  // Buscar configurações da NFS-e com retry
  const { data: nfseSettings, error: nfseError } = useQuery({
    queryKey: ['nfse-sp-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfse_sp_settings')
        .select(`
          *,
          certificates (
            id,
            certificate_data,
            certificate_password,
            valid_until,
            is_valid
          )
        `)
        .single();
      
      if (error) {
        console.error('Erro ao buscar configurações NFS-e:', error);
        throw error;
      }
      return data;
    },
    retry: 3
  });

  useEffect(() => {
    if (nfseError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: "Verifique se as configurações da NFS-e foram definidas."
      });
    }
  }, [nfseError, toast]);

  // Buscar dados da ordem de serviço
  const { data: serviceOrder } = useQuery<ServiceOrder>({
    queryKey: ['service-order', serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', serviceOrderId)
        .single();
      
      if (error) throw error;
      return data as ServiceOrder;
    },
    enabled: !!serviceOrderId
  });

  // Buscar configurações fiscais que incluem o certificado
  const { data: fiscalConfig } = useQuery<FiscalConfigData>({
    queryKey: ['fiscal-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'nfse')
        .single();
      
      if (error) throw error;
      return data as FiscalConfigData;
    }
  });

  const onSubmit = async (data: NFSeFormData) => {
    setIsLoading(true);
    try {
      if (!nfseSettings?.id) {
        throw new Error('Configurações da NFS-e não encontradas');
      }

      // Verificar se há certificado válido
      const hasCertificate = nfseSettings.certificates?.some(cert => cert.is_valid);
      if (!hasCertificate) {
        throw new Error('Certificado digital não configurado ou inválido. Por favor, configure o certificado na aba SEFAZ.');
      }

      if (!serviceOrder?.client_id) {
        throw new Error('Cliente não encontrado na ordem de serviço');
      }

      // Incrementa o número do RPS
      const { data: incrementResult, error: incrementError } = await supabase
        .rpc('increment_rps_sp_numero', {
          p_settings_id: nfseSettings.id
        });

      if (incrementError) {
        console.error('Erro ao incrementar número RPS:', incrementError);
        throw incrementError;
      }

      const dataCompetencia = new Date().toISOString().split('T')[0];
      const regimeEspecialTributacao = data.regime_especial_tributacao || '1';

      // Cria a NFS-e
      const { data: nfse, error: nfseError } = await supabase
        .from('nfse')
        .insert([{
          service_order_id: serviceOrderId,
          client_id: serviceOrder.client_id,
          fiscal_config_id: nfseSettings.id,
          codigo_servico: data.codigo_servico,
          discriminacao_servicos: data.discriminacao_servicos,
          servico_discriminacao_item: data.servico_discriminacao_item,
          servico_codigo_item_lista: data.servico_codigo_item_lista,
          servico_codigo_municipio: data.servico_codigo_municipio || nfseSettings.codigo_municipio,
          servico_codigo_local_prestacao: data.servico_codigo_local_prestacao,
          servico_valor_item: data.servico_valor_item,
          servico_exigibilidade: data.servico_exigibilidade,
          servico_operacao: data.servico_operacao,
          valor_servicos: data.valor_servicos,
          base_calculo: data.base_calculo,
          aliquota_iss: data.aliquota_iss,
          valor_iss: data.valor_iss,
          iss_retido: data.iss_retido,
          regime_especial_tributacao: regimeEspecialTributacao,
          tipo_regime_especial: data.tipo_regime_especial,
          operacao_tributacao: data.operacao_tributacao,
          optante_mei: data.optante_simples_nacional,
          prestador_incentivador_cultural: data.incentivador_cultural,
          tributacao_rps: data.tipo_tributacao,
          tipo_rps: data.tipo_rps,
          serie_rps: data.serie_rps,
          status_rps: 'P',
          status_sefaz: 'processando',
          nfse_sp_settings_id: nfseSettings.id,
          numero_rps: incrementResult?.toString(),
          data_competencia: dataCompetencia
        }])
        .select()
        .single();

      if (nfseError) {
        console.error('Erro ao criar NFS-e:', nfseError);
        throw nfseError;
      }

      // Processa a NFS-e
      const { error: processError } = await supabase.functions.invoke('transmit-nfse', {
        body: { nfseId: nfse.id }
      });

      if (processError) throw processError;

      toast({
        title: "NFS-e enviada com sucesso",
        description: "A NFS-e foi enviada para processamento"
      });

      navigate('/dashboard/nfse');
    } catch (error: any) {
      console.error('Erro ao gerar NFS-e:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar NFS-e",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<NFSeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo_servico: "",
      discriminacao_servicos: "",
      servico_discriminacao_item: "",
      servico_codigo_item_lista: "",
      servico_codigo_municipio: "",
      servico_codigo_local_prestacao: "",
      servico_valor_item: "",
      servico_exigibilidade: "",
      servico_operacao: "",
      valor_servicos: "",
      base_calculo: "",
      aliquota_iss: "",
      valor_iss: "",
      iss_retido: false,
      regime_especial_tributacao: "",
      tipo_regime_especial: "",
      operacao_tributacao: "",
      optante_simples_nacional: false,
      incentivador_cultural: false,
      tipo_tributacao: "",
      tipo_rps: "",
      serie_rps: "",
    },
  });

  return (
    <div className="container mx-auto py-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="codigo_servico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 14.05" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Input placeholder="Ex: Manutenção de equipamentos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="servico_discriminacao_item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discriminação do Item de Serviço</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhe a discriminação do item de serviço"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servico_codigo_item_lista"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Item da Lista de Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Código do item" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servico_codigo_municipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Município do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Código do município" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servico_codigo_local_prestacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Local de Prestação do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Código do local" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servico_valor_item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Item de Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Valor do item" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servico_exigibilidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exigibilidade do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Exigibilidade do serviço" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servico_operacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operação do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Operação do serviço" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_servicos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor dos Serviços</FormLabel>
                  <FormControl>
                    <Input placeholder="Valor dos serviços" {...field} />
                  </FormControl>
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
                    <Input placeholder="Base de cálculo" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aliquota_iss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alíquota ISS</FormLabel>
                  <FormControl>
                    <Input placeholder="Alíquota ISS" {...field} />
                  </FormControl>
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
                    <Input placeholder="Valor ISS" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="iss_retido"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">ISS Retido</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Indica se o ISS é retido na fonte.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="optante_simples_nacional"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Optante pelo Simples Nacional</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Indica se a empresa é optante pelo Simples Nacional.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incentivador_cultural"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Incentivador Cultural</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Indica se a empresa é incentivadora cultural.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="regime_especial_tributacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regime Especial de Tributação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um regime" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                      <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="lucro_real">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_regime_especial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Regime Especial</FormLabel>
                  <FormControl>
                    <Input placeholder="Tipo de regime especial" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operacao_tributacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operação de Tributação</FormLabel>
                  <FormControl>
                    <Input placeholder="Operação de tributação" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_tributacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Tributação</FormLabel>
                  <FormControl>
                    <Input placeholder="Tipo de tributação" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_rps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo RPS</FormLabel>
                  <FormControl>
                    <Input placeholder="Tipo RPS" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serie_rps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Série RPS</FormLabel>
                  <FormControl>
                    <Input placeholder="Série RPS" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            Gerar NFS-e
          </Button>
        </form>
      </Form>
    </div>
  );
}
