
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

export function DBTab() {
  const [activeTab, setActiveTab] = useState("nfse");
  
  const form = useForm({
    defaultValues: {
      id: "",
      numero_nfse: "",
      client_id: "",
      service_order_id: "",
      data_emissao: "",
      valor_servicos: "",
      valor_total: "",
      base_calculo: "",
      codigo_servico: "",
      discriminacao_servicos: "",
      natureza_operacao: "1",
      tipo_recolhimento: "A",
      numero_rps: "",
      serie_rps: "",
      tipo_rps: "RPS",
      status_sefaz: "pendente",
      ambiente: "1",
      cancelada: "false",
      data_cancelamento: "",
      motivo_cancelamento: "",
      xml_envio: "",
      xml_retorno: "",
      pdf_url: "",
      codigo_verificacao: "",
    }
  });

  const nfseFields = [
    { name: 'id', label: 'ID', type: 'text', description: 'ID único da NFSe' },
    { name: 'numero_nfse', label: 'Número NFSe', type: 'number', description: 'Número sequencial da NFSe' },
    { name: 'client_id', label: 'ID do Cliente', type: 'text', description: 'ID do cliente' },
    { name: 'service_order_id', label: 'ID da OS', type: 'text', description: 'ID da ordem de serviço' },
    { name: 'data_emissao', label: 'Data de Emissão', type: 'datetime-local', description: 'Data de emissão' },
    { name: 'valor_servicos', label: 'Valor Serviços', type: 'number', description: 'Valor total dos serviços' },
    { name: 'valor_total', label: 'Valor Total', type: 'number', description: 'Valor total da nota' },
    { name: 'base_calculo', label: 'Base de Cálculo', type: 'number', description: 'Base de cálculo' },
    { name: 'codigo_servico', label: 'Código Serviço', type: 'text', description: 'Código do serviço' },
    { name: 'discriminacao_servicos', label: 'Discriminação', type: 'text', description: 'Descrição dos serviços' },
    { name: 'natureza_operacao', label: 'Natureza Operação', type: 'text', description: 'Natureza da operação' },
    { name: 'tipo_recolhimento', label: 'Tipo Recolhimento', type: 'text', description: 'Tipo de recolhimento' },
    { name: 'numero_rps', label: 'Número RPS', type: 'text', description: 'Número do RPS' },
    { name: 'serie_rps', label: 'Série RPS', type: 'text', description: 'Série do RPS' },
    { name: 'tipo_rps', label: 'Tipo RPS', type: 'text', description: 'Tipo do RPS' },
    { name: 'status_sefaz', label: 'Status SEFAZ', type: 'text', description: 'Status na SEFAZ' },
    { name: 'ambiente', label: 'Ambiente', type: 'text', description: 'Ambiente (homologação/produção)' },
    { name: 'cancelada', label: 'Cancelada', type: 'text', description: 'Se a nota foi cancelada' },
    { name: 'data_cancelamento', label: 'Data Cancelamento', type: 'datetime-local', description: 'Data do cancelamento' },
    { name: 'motivo_cancelamento', label: 'Motivo Cancelamento', type: 'text', description: 'Motivo do cancelamento' },
    { name: 'xml_envio', label: 'XML Envio', type: 'text', description: 'XML de envio' },
    { name: 'xml_retorno', label: 'XML Retorno', type: 'text', description: 'XML de retorno' },
    { name: 'pdf_url', label: 'URL do PDF', type: 'text', description: 'URL do PDF da nota' },
    { name: 'codigo_verificacao', label: 'Código Verificação', type: 'text', description: 'Código de verificação' }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="nfse" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="nfse">NFSe</TabsTrigger>
        </TabsList>

        <TabsContent value="nfse" className="space-y-4">
          <ScrollArea className="h-[600px] w-full rounded-md border p-4">
            <Form {...form}>
              <form className="space-y-4">
                {nfseFields.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          <Input 
                            type={field.type} 
                            {...formField} 
                            className="max-w-xl"
                          />
                        </FormControl>
                        <FormDescription>{field.description}</FormDescription>
                      </FormItem>
                    )}
                  />
                ))}
              </form>
            </Form>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
