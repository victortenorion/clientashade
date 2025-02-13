
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NFCeViewProps {
  nfceId: string | null;
  onClose: () => void;
}

export function NFCeView({ nfceId, onClose }: NFCeViewProps) {
  const { data: nfce } = useQuery({
    queryKey: ["nfce", nfceId],
    queryFn: async () => {
      if (!nfceId) return null;

      const { data: nfce, error: nfceError } = await supabase
        .from("nfce")
        .select(`
          *,
          clients (
            name,
            document
          )
        `)
        .eq("id", nfceId)
        .maybeSingle();

      if (nfceError) throw nfceError;

      const { data: items, error: itemsError } = await supabase
        .from("nfce_items")
        .select(`
          *,
          products (
            name,
            description
          )
        `)
        .eq("nfce_id", nfceId);

      if (itemsError) throw itemsError;

      return { ...nfce, items };
    },
    enabled: !!nfceId,
  });

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={!!nfceId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            NFC-e nº {nfce?.numero_nfce} - {nfce?.clients?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Informações Gerais</h3>
              <dl className="space-y-1">
                <div className="grid grid-cols-3">
                  <dt className="text-gray-500">Data Emissão:</dt>
                  <dd className="col-span-2">
                    {nfce?.data_emissao &&
                      format(new Date(nfce.data_emissao), "dd/MM/yyyy HH:mm")}
                  </dd>
                </div>
                <div className="grid grid-cols-3">
                  <dt className="text-gray-500">Status:</dt>
                  <dd className="col-span-2">{nfce?.status_sefaz}</dd>
                </div>
                <div className="grid grid-cols-3">
                  <dt className="text-gray-500">Ambiente:</dt>
                  <dd className="col-span-2">{nfce?.ambiente}</dd>
                </div>
                <div className="grid grid-cols-3">
                  <dt className="text-gray-500">Forma Pagamento:</dt>
                  <dd className="col-span-2">{nfce?.forma_pagamento}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-medium mb-2">Cliente</h3>
              <dl className="space-y-1">
                <div className="grid grid-cols-3">
                  <dt className="text-gray-500">Nome:</dt>
                  <dd className="col-span-2">{nfce?.clients?.name}</dd>
                </div>
                <div className="grid grid-cols-3">
                  <dt className="text-gray-500">Documento:</dt>
                  <dd className="col-span-2">{nfce?.clients?.document}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Itens</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtde</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nfce?.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.products?.name}</TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.valor_unitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.valor_desconto || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.valor_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end space-x-4 text-sm">
            <div>
              <span className="font-medium">Valor Produtos:</span>{" "}
              {formatMoney(nfce?.valor_produtos || 0)}
            </div>
            <div>
              <span className="font-medium">Descontos:</span>{" "}
              {formatMoney(nfce?.valor_desconto || 0)}
            </div>
            <div>
              <span className="font-medium">Valor Total:</span>{" "}
              {formatMoney(nfce?.valor_total || 0)}
            </div>
          </div>

          {nfce?.cancelada && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="text-red-800 font-medium">Nota Cancelada</h4>
              <p className="text-red-600 text-sm mt-1">
                Data: {format(new Date(nfce.data_cancelamento!), "dd/MM/yyyy HH:mm")}
                <br />
                Motivo: {nfce.motivo_cancelamento}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
