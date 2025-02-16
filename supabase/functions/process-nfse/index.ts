
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
        nfse_sp_settings (
          *
        )
      `)
      .eq('id', nfseId)
      .single();

    if (nfseError) throw nfseError;

    // Buscar certificado
    const { data: certificate, error: certError } = await supabaseClient
      .from('certificates')
      .select('*')
      .eq('id', nfse.nfse_sp_settings.certificado_id)
      .single();

    if (certError) throw certError;

    // Atualizar status da NFS-e para processando
    const { error: updateError } = await supabaseClient
      .from('nfse')
      .update({ status_sefaz: 'processando' })
      .eq('id', nfseId);

    if (updateError) throw updateError;

    // Registrar log de início do processamento
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseId,
        status: 'processando',
        message: 'Iniciando transmissão para SEFAZ',
      });

    // TODO: Implementar lógica de envio para SEFAZ SP
    // 1. Montar XML do RPS
    // 2. Assinar XML com certificado
    // 3. Enviar para SEFAZ
    // 4. Processar retorno

    // Por enquanto, simular processamento bem-sucedido
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Atualizar status da NFS-e como autorizada
    await supabaseClient
      .from('nfse')
      .update({
        status_sefaz: 'autorizada',
        codigo_verificacao: 'TESTE123', // Será substituído pelo código real
      })
      .eq('id', nfseId);

    // Registrar log de sucesso
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseId,
        status: 'sucesso',
        message: 'NFS-e transmitida com sucesso',
      });

    return new Response(
      JSON.stringify({ success: true, message: 'NFS-e transmitida com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao transmitir NFS-e:', error);

    // Registrar log de erro
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: (await req.json() as NFSeData).nfseId,
        status: 'erro',
        message: error.message,
      });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
