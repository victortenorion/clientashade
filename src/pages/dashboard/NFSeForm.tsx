import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

interface NFSeFormData {
  codigo_servico: string;
  discriminacao_servicos: string;
  servico_discriminacao_item: string;
  servico_codigo_item_lista: string;
  servico_codigo_municipio: string;
  servico_codigo_local_prestacao: string;
  servico_valor_item: number;
  servico_exigibilidade: string;
  servico_operacao: string;
  valor_servicos: number;
  base_calculo: number;
  aliquota_iss: number;
  valor_iss: number;
  iss_retido: boolean;
  regime_especial_tributacao: string;
  tipo_regime_especial: string;
  operacao_tributacao: string;
  optante_simples_nacional: boolean;
  incentivador_cultural: boolean;
  tipo_rps: string;
  serie_rps: string;
  tipo_tributacao: string;
}

export default function NFSeForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const serviceOrderId = searchParams.get('service_order_id');
  const form = useForm<NFSeFormData>({
    defaultValues: {
      tipo_rps: 'RPS',
      serie_rps: '1',
      servico_exigibilidade: '1',
      servico_operacao: '1',
      operacao_tributacao: '1',
    }
  });

  const { data: companyInfo } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      console.log('Company Info:', data); // Debug
      return data;
    }
  });

  const { data: fiscalConfig } = useQuery({
    queryKey: ['fiscalConfig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('type', 'nfse')
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: serviceOrder } = useQuery({
    queryKey: ['serviceOrder', serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:client_id (*)
        `)
        .eq('id', serviceOrderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceOrderId
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_codes')
        .select('*')
        .order('code');

      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (!serviceOrderId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ordem de serviço não encontrada"
      });
      navigate('/dashboard/service-orders');
    }

    if (serviceOrder && companyInfo && fiscalConfig?.config) {
      console.log('Setting form values with:', {
        serviceOrder,
        companyInfo,
        fiscalConfig
      });

      // Garantir que o código do serviço seja uma string
      const codigoServico = String(serviceOrder?.codigo_servico ?? companyInfo?.codigo_servico ?? '');

      form.reset({
        codigo_servico: codigoServico,
        discriminacao_servicos: serviceOrder?.discriminacao_servico ?? '',
        servico_discriminacao_item: serviceOrder?.servico_discriminacao_item ?? '',
        servico_codigo_item_lista: serviceOrder?.servico_codigo_item_lista ?? companyInfo?.codigo_servico_lc116 ?? '',
        servico_codigo_municipio: serviceOrder?.servico_codigo_municipio ?? companyInfo?.endereco_codigo_municipio ?? '',
        servico_codigo_local_prestacao: serviceOrder?.servico_codigo_local_prestacao ?? '',
        servico_valor_item: serviceOrder?.servico_valor_item ?? 0,
        servico_exigibilidade: serviceOrder?.servico_exigibilidade ?? fiscalConfig.config.servico_exigibilidade ?? '1',
        servico_operacao: serviceOrder?.servico_operacao ?? fiscalConfig.config.servico_operacao ?? '1',
        valor_servicos: serviceOrder?.total_price ?? 0,
        base_calculo: serviceOrder?.base_calculo ?? serviceOrder?.total_price ?? 0,
        aliquota_iss: serviceOrder?.aliquota_iss ?? fiscalConfig.config.aliquota_servico ?? 0,
        valor_iss: (serviceOrder?.base_calculo ?? serviceOrder?.total_price ?? 0) * (serviceOrder?.aliquota_iss ?? fiscalConfig.config.aliquota_servico ?? 0) / 100,
        iss_retido: serviceOrder?.iss_retido ?? false,
        regime_especial_tributacao: serviceOrder?.regime_especial ?? fiscalConfig.config.regime_especial ?? '1',
        tipo_regime_especial: fiscalConfig.config.tipo_regime_especial ?? '',
        operacao_tributacao: serviceOrder?.operacao_tributacao ?? fiscalConfig.config.operacao_tributacao ?? '1',
        optante_simples_nacional: fiscalConfig.config.optante_simples_nacional ?? false,
        incentivador_cultural: fiscalConfig.config.incentivador_cultural ?? false,
        tipo_tributacao: 'T',
        tipo_rps: fiscalConfig.config.rps_tipo ?? 'RPS',
        serie_rps: fiscalConfig.config.rps_serie ?? '1',
      });
    }
  }, [serviceOrderId, navigate, toast, serviceOrder, companyInfo, fiscalConfig, form]);

  const onSubmit = async (data: NFSeFormData) => {
    setIsLoading(true);
    try {
      if (!serviceOrder) throw new Error('Ordem de serviço não encontrada');

      const { data: nfse, error: nfseError } = await supabase
        .from('nfse')
        .insert([{
          service_order_id: serviceOrderId,
          client_id: serviceOrder.client_id,
          codigo_servico: data.codigo_servico,
          discriminacao_servicos: data.discriminacao_servicos,
          servico_discriminacao_item: data.servico_discriminacao_item,
          servico_codigo_item_lista: data.servico_codigo_item_lista,
          servico_codigo_municipio: data.servico_codigo_municipio,
          servico_codigo_local_prestacao: data.servico_codigo_local_prestacao,
          servico_valor_item: data.servico_valor_item,
          servico_exigibilidade: data.servico_exigibilidade,
          servico_operacao: data.servico_operacao,
          valor_servicos: data.valor_servicos,
          base_calculo: data.base_calculo,
          aliquota_iss: data.aliquota_iss,
          valor_iss: data.valor_iss,
          iss_retido: data.iss_retido,
          regime_especial_tributacao: data.regime_especial_tributacao,
          tipo_regime_especial: data.tipo_regime_especial,
          operacao_tributacao: data.operacao_tributacao,
          optante_mei: data.optante_simples_nacional,
          prestador_incentivador_cultural: data.incentivador_cultural,
          tributacao_rps: data.tipo_tributacao,
          tipo_rps: data.tipo_rps,
          serie_rps: data.serie_rps,
          status_rps: 'N', // Normal
        }])
        .select()
        .single();

      if (nfseError) throw nfseError;

      toast({
        title: "NFS-e gerada com sucesso",
        description: `NFS-e número ${nfse.numero_nfse} criada`
      });

      navigate('/dashboard/nfse');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar NFS-e",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Nova NFS-e</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <FormField
            control={form.control}
            name="codigo_servico"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código do Serviço</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o código do serviço" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.code} value={service.code}>
                        {service.code} - {service.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="servico_codigo_item_lista"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Item Lista Serviço</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: 1.01" />
                </FormControl>
                <FormDescription>
                  Código do serviço conforme LC 116
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="servico_codigo_municipio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código do Município</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: 3550308" />
                </FormControl>
                <FormDescription>
                  Código IBGE do município onde o serviço foi prestado
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="servico_discriminacao_item"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discriminação do Item</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} />
                </FormControl>
                <FormDescription>
                  Descrição detalhada do serviço prestado
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="servico_exigibilidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exigibilidade do ISS</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a exigibilidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Exigível</SelectItem>
                    <SelectItem value="2">Não incidência</SelectItem>
                    <SelectItem value="3">Isenção</SelectItem>
                    <SelectItem value="4">Exportação</SelectItem>
                    <SelectItem value="5">Imunidade</SelectItem>
                    <SelectItem value="6">Suspensa por decisão judicial</SelectItem>
                    <SelectItem value="7">Suspensa por processo administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="valor_servicos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor dos Serviços</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aliquota_iss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alíquota ISS (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="iss_retido"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-4">
                <div className="space-y-0.5">
                  <FormLabel>ISS Retido</FormLabel>
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
            name="regime_especial_tributacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regime Especial Tributação</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Microempresa Municipal</SelectItem>
                    <SelectItem value="2">Estimativa</SelectItem>
                    <SelectItem value="3">Sociedade de Profissionais</SelectItem>
                    <SelectItem value="4">Cooperativa</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="optante_simples_nacional"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Optante pelo Simples Nacional</FormLabel>
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
                <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Incentivador Cultural</FormLabel>
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

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Emitindo..." : "Emitir NFS-e"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
