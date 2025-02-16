
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { jsPDF } from "npm:jspdf";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NFSeData {
  nfseId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nfseId } = await req.json() as NFSeData;

    // Buscar dados da NFS-e
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        clients (
          *
        ),
        company_info (
          *
        )
      `)
      .eq('id', nfseId)
      .single();

    if (nfseError) throw nfseError;

    // Criar PDF
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(18);
    doc.text('NOTA FISCAL DE SERVIÇO ELETRÔNICA - NFS-e', 105, 20, { align: 'center' });

    // Informações da empresa
    doc.setFontSize(12);
    doc.text(`Razão Social: ${nfse.company_info.razao_social}`, 20, 40);
    doc.text(`CNPJ: ${nfse.company_info.cnpj}`, 20, 50);
    doc.text(`Inscrição Municipal: ${nfse.company_info.inscricao_municipal}`, 20, 60);

    // Informações da nota
    doc.text(`Número da Nota: ${nfse.numero_nfse}`, 20, 80);
    doc.text(`Data de Emissão: ${new Date(nfse.data_emissao).toLocaleDateString()}`, 20, 90);
    doc.text(`Código de Verificação: ${nfse.codigo_verificacao}`, 20, 100);

    // Informações do tomador
    doc.text('TOMADOR DE SERVIÇOS', 105, 120, { align: 'center' });
    doc.text(`Nome/Razão Social: ${nfse.clients.name}`, 20, 130);
    doc.text(`CNPJ/CPF: ${nfse.clients.document}`, 20, 140);
    doc.text(`Endereço: ${nfse.clients.street}, ${nfse.clients.street_number}`, 20, 150);
    doc.text(`${nfse.clients.city} - ${nfse.clients.state}`, 20, 160);

    // Valores
    doc.text('VALORES', 105, 180, { align: 'center' });
    doc.text(`Valor dos Serviços: R$ ${nfse.valor_servicos.toFixed(2)}`, 20, 190);
    doc.text(`Alíquota: ${nfse.aliquota_servico}%`, 20, 200);
    doc.text(`ISS: R$ ${(nfse.valor_servicos * (nfse.aliquota_servico / 100)).toFixed(2)}`, 20, 210);

    // Discriminação dos serviços
    doc.text('DISCRIMINAÇÃO DOS SERVIÇOS', 105, 230, { align: 'center' });
    doc.setFontSize(10);
    const servicos = doc.splitTextToSize(nfse.discriminacao_servicos, 170);
    doc.text(servicos, 20, 240);

    // Converter PDF para base64
    const pdfBase64 = doc.output('datauristring');

    // Atualizar NFS-e com URL do PDF
    await supabaseClient
      .from('nfse')
      .update({
        pdf_url: pdfBase64
      })
      .eq('id', nfseId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfBase64
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
