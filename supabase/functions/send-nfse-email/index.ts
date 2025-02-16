
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@0.16.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    // Enviar e-mail
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: 'NFS-e <nfse@resend.dev>',
      to: [nfse.clients.email],
      subject: `NFS-e ${nfse.numero_nfse} - ${nfse.company_info.razao_social}`,
      html: `
        <h1>Nota Fiscal de Serviço Eletrônica</h1>
        <p>Prezado(a) ${nfse.clients.name},</p>
        <p>Segue em anexo a Nota Fiscal de Serviço Eletrônica nº ${nfse.numero_nfse}.</p>
        <p><strong>Valor:</strong> R$ ${nfse.valor_servicos.toFixed(2)}</p>
        <p><strong>Data de Emissão:</strong> ${new Date(nfse.data_emissao).toLocaleDateString()}</p>
        <p><strong>Código de Verificação:</strong> ${nfse.codigo_verificacao}</p>
        <hr>
        <p>Este é um e-mail automático, por favor não responda.</p>
      `,
      attachments: [
        {
          filename: `nfse_${nfse.numero_nfse}.pdf`,
          content: nfse.pdf_url.split('base64,')[1],
        },
      ],
    });

    if (emailError) throw emailError;

    // Registrar envio do e-mail
    await supabaseClient
      .from('nfse_eventos')
      .insert({
        nfse_id: nfseId,
        tipo_evento: 'email',
        descricao: 'E-mail enviado com sucesso',
        status: 'concluido'
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'E-mail enviado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
