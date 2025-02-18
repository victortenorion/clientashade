
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DBTab() {
  const [activeTab, setActiveTab] = useState("nfse");

  const nfseFields = [
    { name: 'id', type: 'uuid', nullable: false, default: 'uuid_generate_v4()', description: 'ID único da NFSe' },
    { name: 'numero_nfse', type: 'integer', nullable: false, default: 'sequence', description: 'Número sequencial da NFSe' },
    { name: 'client_id', type: 'uuid', nullable: false, default: 'None', description: 'ID do cliente' },
    { name: 'service_order_id', type: 'uuid', nullable: true, default: 'None', description: 'ID da ordem de serviço' },
    { name: 'data_emissao', type: 'timestamp', nullable: false, default: 'now()', description: 'Data de emissão' },
    { name: 'valor_servicos', type: 'numeric', nullable: false, default: 'None', description: 'Valor total dos serviços' },
    { name: 'valor_total', type: 'numeric', nullable: true, default: 'None', description: 'Valor total da nota' },
    { name: 'base_calculo', type: 'numeric', nullable: true, default: 'None', description: 'Base de cálculo' },
    { name: 'codigo_servico', type: 'text', nullable: false, default: 'None', description: 'Código do serviço' },
    { name: 'discriminacao_servicos', type: 'text', nullable: false, default: 'None', description: 'Descrição dos serviços' },
    { name: 'natureza_operacao', type: 'text', nullable: true, default: '1', description: 'Natureza da operação' },
    { name: 'tipo_recolhimento', type: 'text', nullable: true, default: 'A', description: 'Tipo de recolhimento' },
    { name: 'numero_rps', type: 'text', nullable: false, default: 'None', description: 'Número do RPS' },
    { name: 'serie_rps', type: 'text', nullable: false, default: 'None', description: 'Série do RPS' },
    { name: 'tipo_rps', type: 'text', nullable: false, default: 'RPS', description: 'Tipo do RPS' },
    { name: 'status_sefaz', type: 'text', nullable: true, default: 'pendente', description: 'Status na SEFAZ' },
    { name: 'ambiente', type: 'text', nullable: true, default: '1', description: 'Ambiente (homologação/produção)' },
    { name: 'cancelada', type: 'boolean', nullable: true, default: 'false', description: 'Se a nota foi cancelada' },
    { name: 'data_cancelamento', type: 'timestamp', nullable: true, default: 'None', description: 'Data do cancelamento' },
    { name: 'motivo_cancelamento', type: 'text', nullable: true, default: 'None', description: 'Motivo do cancelamento' },
    { name: 'xml_envio', type: 'text', nullable: true, default: 'None', description: 'XML de envio' },
    { name: 'xml_retorno', type: 'text', nullable: true, default: 'None', description: 'XML de retorno' },
    { name: 'pdf_url', type: 'text', nullable: true, default: 'None', description: 'URL do PDF da nota' },
    { name: 'codigo_verificacao', type: 'text', nullable: true, default: 'None', description: 'Código de verificação' },
    { name: 'created_at', type: 'timestamp', nullable: true, default: 'now()', description: 'Data de criação' },
    { name: 'updated_at', type: 'timestamp', nullable: true, default: 'now()', description: 'Data de atualização' }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="nfse" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="nfse">NFSe</TabsTrigger>
        </TabsList>

        <TabsContent value="nfse" className="space-y-4">
          <div className="rounded-md border">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Campo</TableHead>
                    <TableHead className="w-[150px]">Tipo</TableHead>
                    <TableHead className="w-[100px]">Obrigatório</TableHead>
                    <TableHead className="w-[200px]">Valor Padrão</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nfseFields.map((field) => (
                    <TableRow key={field.name}>
                      <TableCell className="font-medium">{field.name}</TableCell>
                      <TableCell>{field.type}</TableCell>
                      <TableCell>{field.nullable ? "Não" : "Sim"}</TableCell>
                      <TableCell>{field.default}</TableCell>
                      <TableCell>{field.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
