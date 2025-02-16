
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

interface NFSeSPSettingsForm {
  inscricao_municipal: string;
  codigo_regime_tributario: string;
  tipo_documento: string;
  serie_rps_padrao: string;
  tipo_rps_padrao: string;
  codigo_tributacao_municipio: string;
  servico_codigo_cnae: string;
  aliquota_iss_padrao: number;
  descricao_servico_padrao: string;
  natureza_operacao: string;
  regime_tributario: string;
  optante_simples_nacional: boolean;
  iss_retencao_fonte: boolean;
  modo_contingencia: boolean;
  fonte_tributos: string;
  mensagem_complementar?: string;
}

export function NFSeSPSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NFSeSPSettingsForm>({
    defaultValues: {
      serie_rps_padrao: "1",
      tipo_rps_padrao: "RPS",
      natureza_operacao: "1",
      regime_tributario: "1",
      fonte_tributos: "I",
      optante_simples_nacional: false,
      iss_retencao_fonte: false,
      modo_contingencia: false
    }
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("nfse_sp_settings")
          .select("*")
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            inscricao_municipal: data.inscricao_municipal || "",
            codigo_regime_tributario: data.codigo_regime_tributario || "1",
            tipo_documento: data.tipo_documento || "CNPJ",
            serie_rps_padrao: data.serie_rps_padrao || "1",
            tipo_rps_padrao: data.tipo_rps_padrao || "RPS",
            codigo_tributacao_municipio: data.codigo_tributacao_municipio || "",
            servico_codigo_cnae: data.servico_codigo_cnae || "",
            aliquota_iss_padrao: data.aliquota_iss_padrao || 0,
            descricao_servico_padrao: data.descricao_servico_padrao || "",
            natureza_operacao: data.natureza_operacao || "1",
            regime_tributario: data.regime_tributario || "1",
            optante_simples_nacional: data.optante_simples_nacional || false,
            iss_retencao_fonte: data.iss_retencao_fonte || false,
            modo_contingencia: data.modo_contingencia || false,
            fonte_tributos: data.fonte_tributos || "I",
            mensagem_complementar: data.mensagem_complementar || "",
          });
        }
      } catch (error: any) {
        console.error("Erro ao carregar configurações:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar configurações",
          description: error.message,
        });
      }
    };

    loadSettings();
  }, [form, toast]);

  const onSubmit = async (data: NFSeSPSettingsForm) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("nfse_sp_settings")
        .upsert([{
          ...data,
          updated_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações da NFS-e SP foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações NFS-e São Paulo</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inscricao_municipal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição Municipal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Digite a inscrição municipal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo_regime_tributario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regime Tributário</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o regime tributário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Microempresa Municipal</SelectItem>
                        <SelectItem value="2">Estimativa</SelectItem>
                        <SelectItem value="3">Sociedade de Profissionais</SelectItem>
                        <SelectItem value="4">Cooperativa</SelectItem>
                        <SelectItem value="5">MEI</SelectItem>
                        <SelectItem value="6">ME EPP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serie_rps_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série do RPS</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Série padrão para emissão de RPS
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_rps_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de RPS</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de RPS" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RPS">RPS</SelectItem>
                        <SelectItem value="NFE">NFe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="servico_codigo_cnae"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código CNAE</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 6201500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aliquota_iss_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alíquota ISS Padrão (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao_servico_padrao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Padrão do Serviço</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descrição padrão para as notas fiscais" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="optante_simples_nacional"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Optante pelo Simples Nacional
                      </FormLabel>
                      <FormDescription>
                        Empresa optante pelo Simples Nacional
                      </FormDescription>
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
                name="iss_retencao_fonte"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        ISS Retido na Fonte
                      </FormLabel>
                      <FormDescription>
                        ISS será retido na fonte por padrão
                      </FormDescription>
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

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
