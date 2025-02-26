import { useEffect, useState } from "react";
import { ServiceOrder } from "@/pages/dashboard/types/service-order-settings.types";
import { supabase } from "@/lib/supabase";
import { Download } from "lucide-react";

export function ServiceOrderDetails({ serviceOrder }: { serviceOrder: ServiceOrder }) {
  const [attachments, setAttachments] = useState<any[]>([]);
  
  useEffect(() => {
    loadAttachments();
  }, [serviceOrder.id]);

  const loadAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('service_order_attachments')
        .select('*')
        .eq('service_order_id', serviceOrder.id);

      if (error) throw error;
      
      const attachmentsWithUrls = await Promise.all(
        data.map(async (attachment) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('service_order_attachments')
            .getPublicUrl(attachment.file_path);
            
          return {
            ...attachment,
            url: publicUrl
          };
        })
      );

      setAttachments(attachmentsWithUrls);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <strong>ID:</strong> {serviceOrder.id}
      </div>
      <div>
        <strong>Description:</strong> {serviceOrder.description}
      </div>
      <div>
        <strong>Status:</strong> {serviceOrder.status?.name}
      </div>
      <div>
        <strong>Total Price:</strong> {serviceOrder.total_price}
      </div>
      <div>
        <strong>Created At:</strong> {serviceOrder.created_at}
      </div>
      <div>
        <strong>Order Number:</strong> {serviceOrder.order_number}
      </div>
      <div>
        <strong>Priority:</strong> {serviceOrder.priority}
      </div>
      <div>
        <strong>Equipment:</strong> {serviceOrder.equipment}
      </div>
      <div>
        <strong>Equipment Serial Number:</strong> {serviceOrder.equipment_serial_number}
      </div>
      <div>
        <strong>Problem:</strong> {serviceOrder.problem}
      </div>
      <div>
        <strong>Expected Date:</strong> {serviceOrder.expected_date}
      </div>
      <div>
        <strong>Completion Date:</strong> {serviceOrder.completion_date}
      </div>
      <div>
        <strong>Exit Date:</strong> {serviceOrder.exit_date}
      </div>
      <div>
        <strong>Reception Notes:</strong> {serviceOrder.reception_notes}
      </div>
      <div>
        <strong>Internal Notes:</strong> {serviceOrder.internal_notes}
      </div>
      <div>
        <strong>Código Serviço:</strong> {serviceOrder.codigo_servico}
      </div>
      <div>
        <strong>Discriminação Serviço:</strong> {serviceOrder.discriminacao_servico}
      </div>
      <div>
        <strong>Regime Tributário:</strong> {serviceOrder.regime_tributario}
      </div>
      <div>
        <strong>Regime Especial:</strong> {serviceOrder.regime_especial}
      </div>
      <div>
        <strong>ISS Retido:</strong> {serviceOrder.iss_retido ? 'Sim' : 'Não'}
      </div>
      <div>
        <strong>INSS Retido:</strong> {serviceOrder.inss_retido ? 'Sim' : 'Não'}
      </div>
      <div>
        <strong>IR Retido:</strong> {serviceOrder.ir_retido ? 'Sim' : 'Não'}
      </div>
      <div>
        <strong>PIS/COFINS/CSLL Retido:</strong> {serviceOrder.pis_cofins_csll_retido ? 'Sim' : 'Não'}
      </div>
      <div>
        <strong>Alíquota ISS:</strong> {serviceOrder.aliquota_iss}
      </div>
      <div>
        <strong>Base de Cálculo:</strong> {serviceOrder.base_calculo}
      </div>
      <div>
        <strong>Valor de Deduções:</strong> {serviceOrder.valor_deducoes}
      </div>
      <div>
        <strong>RPS Número:</strong> {serviceOrder.rps_numero}
      </div>
      <div>
        <strong>RPS Série:</strong> {serviceOrder.rps_serie}
      </div>
      <div>
        <strong>RPS Tipo:</strong> {serviceOrder.rps_tipo}
      </div>
      
      {/* Add attachments section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Anexos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="relative group">
              {attachment.content_type?.startsWith('image/') ? (
                <img
                  src={attachment.url}
                  alt={attachment.file_name}
                  className="w-full h-32 object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    {attachment.file_name}
                  </span>
                </div>
              )}
              <a
                href={attachment.url}
                download={attachment.file_name}
                className="absolute bottom-2 right-2 bg-background/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
