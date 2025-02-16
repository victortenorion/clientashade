
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

// Schema de validação
const serviceOrderSchema = z.object({
  // Informações do Tomador
  tomador: z.object({
    tipo_documento: z.enum(["CPF", "CNPJ"]),
    documento: z.string().min(11),
    razao_social: z.string().min(2),
    email: z.string().email(),
    endereco: z.object({
      logradouro: z.string(),
      numero: z.string(),
      complemento: z.string().optional(),
      bairro: z.string(),
      cidade: z.string(),
      uf: z.string().length(2),
      cep: z.string().length(8)
    })
  }),
  // Informações do Serviço
  servico: z.object({
    codigo: z.string(),
    discriminacao: z.string().min(10),
    valor: z.number().positive()
  }),
  // Informações de Tributação
  tributacao: z.object({
    iss_retido: z.boolean(),
    pis_cofins_csll_retido: z.boolean(),
    inss_retido: z.boolean(),
    ir_retido: z.boolean(),
    aliquota_iss: z.number().min(0).max(100),
    valor_deducoes: z.number().min(0)
  })
});

type ServiceOrderFormValues = z.infer<typeof serviceOrderSchema>;

export default function ServiceOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [serviceCodes, setServiceCodes] = useState<{ code: string; description: string }[]>([]);

  const form = useForm<ServiceOrderFormValues>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: {
      tomador: {
        tipo_documento: "CPF",
        documento: "",
        razao_social: "",
        email: "",
        endereco: {
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          uf: "",
          cep: ""
        }
      },
      servico: {
        codigo: "",
        discriminacao: "",
        valor: 0
      },
      tributacao: {
        iss_retido: false,
        pis_cofins_csll_retido: false,
        inss_retido: false,
        ir_retido: false,
        aliquota_iss: 0,
        valor_deducoes: 0
      }
    }
  });

  useEffect(() => {
    loadServiceCodes();
  }, []);

  const loadServiceCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('service_codes')
        .select('code, description')
        .order('code');

      if (error) throw error;
      setServiceCodes(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar códigos de serviço",
        description: error.message
      });
    }
  };

  const onSubmit = async (data: ServiceOrderFormValues) => {
    try {
      setLoading(true);

      // Primeiro, buscar a loja do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: storeData, error: storeError } = await supabase
        .from("user_stores")
        .select("store_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!storeData?.store_id) throw new Error("Usuário não está associado a uma loja");

      // Criar ou atualizar o cliente
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .upsert({
          document: data.tomador.documento,
          name: data.tomador.razao_social,
          email: data.tomador.email,
          street: data.tomador.endereco.logradouro,
          street_number: data.tomador.endereco.numero,
          complement: data.tomador.endereco.complemento,
          neighborhood: data.tomador.endereco.bairro,
          city: data.tomador.endereco.cidade,
          state: data.tomador.endereco.uf,
          zip_code: data.tomador.endereco.cep,
          store_id: storeData.store_id
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Criar a ordem de serviço
      const { data: orderData, error: orderError } = await supabase
        .from("service_orders")
        .insert([
          {
            store_id: storeData.store_id,
            client_id: clientData.id,
            total_price: data.servico.valor,
            description: data.servico.discriminacao
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar o item de serviço
      const { error: itemError } = await supabase
        .from("service_order_items")
        .insert([
          {
            service_order_id: orderData.id,
            description: data.servico.discriminacao,
            price: data.servico.valor,
            quantity: 1
          }
        ]);

      if (itemError) throw itemError;

      toast({
        title: "Ordem de serviço criada com sucesso",
        description: "Redirecionando para os detalhes..."
      });

      navigate(`/dashboard/service-orders/${orderData.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar ordem de serviço",
        description: error.message
      });
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold">Nova Ordem de Serviço</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="tomador">
            <TabsList>
              <TabsTrigger value="tomador">Tomador</TabsTrigger>
              <TabsTrigger value="servico">Serviço</TabsTrigger>
              <TabsTrigger value="tributacao">Tributação</TabsTrigger>
            </TabsList>

            <TabsContent value="tomador">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Tomador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tomador.tipo_documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="CNPJ">CNPJ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tomador.documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Documento</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tomador.razao_social"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome/Razão Social</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tomador.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tomador.endereco.logradouro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tomador.endereco.numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tomador.endereco.complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tomador.endereco.bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tomador.endereco.cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tomador.endereco.uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a UF" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              {/* Adicionar outros estados */}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tomador.endereco.cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="servico">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Serviço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="servico.codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código do Serviço</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o código" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceCodes.map(code => (
                              <SelectItem key={code.code} value={code.code}>
                                {code.code} - {code.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="servico.discriminacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discriminação do Serviço</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Descreva detalhadamente o serviço prestado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="servico.valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Serviço</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tributacao">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Tributação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tributacao.iss_retido"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>ISS Retido</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tributacao.pis_cofins_csll_retido"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>PIS/COFINS/CSLL Retido</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tributacao.inss_retido"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>INSS Retido</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tributacao.ir_retido"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>IR Retido</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tributacao.aliquota_iss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alíquota ISS (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tributacao.valor_deducoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor das Deduções</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Ordem de Serviço"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
