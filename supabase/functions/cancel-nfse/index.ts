
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nfseId, motivoCancelamento } = await req.json();

    // Verificar se a NFS-e existe e pode ser cancelada
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select('*')
      .eq('id', nfseId)
      .single();

    if (nfseError) throw new Error('NFS-e não encontrada');
    if (nfse.cancelada) throw new Error('NFS-e já está cancelada');
    if (nfse.status_sefaz !== 'autorizada') throw new Error('Apenas NFS-e autorizadas podem ser canceladas');

    // TODO: Implementar chamada à API da prefeitura para cancelamento
    console.log('Simulando chamada à API da prefeitura para cancelamento...');

    // Atualizar status da NFS-e
    const { error: updateError } = await supabaseClient
      .from('nfse')
      .update({
        cancelada: true,
        data_cancelamento: new Date().toISOString(),
        motivo_cancelamento: motivoCancelamento
      })
      .eq('id', nfseId);

    if (updateError) throw updateError;

    // Registrar evento de cancelamento
    await supabaseClient
      .from('nfse_eventos')
      .insert({
        nfse_id: nfseId,
        tipo_evento: 'cancelamento',
        status: 'sucesso',
        descricao: motivoCancelamento
      });

    return new Response(
      JSON.stringify({ success: true, message: 'NFS-e cancelada com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao cancelar NFS-e:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
