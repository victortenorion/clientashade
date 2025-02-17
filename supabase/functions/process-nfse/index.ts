
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Ler o corpo da requisição uma única vez
  let nfseData: NFSeData;
  try {
    nfseData = await req.json() as NFSeData;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erro ao ler dados da requisição' }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Verificar dados da NFS-e
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        clients (*),
        nfse_sp_settings (*)
      `)
      .eq('id', nfseData.nfseId)
      .single();

    if (nfseError) throw nfseError;
    if (!nfse) throw new Error('NFS-e não encontrada');

    // Verificar se as configurações existem
    if (!nfse.nfse_sp_settings) {
      throw new Error('Configurações da NFS-e SP não encontradas. Por favor, configure primeiro.');
    }

    // Verificar se já está autorizada
    if (nfse.status_sefaz === 'autorizada') {
      throw new Error('NFS-e já está autorizada');
    }

    // Verificar se está cancelada
    if (nfse.cancelada) {
      throw new Error('NFS-e está cancelada');
    }

    // Verificar certificado
    if (!nfse.nfse_sp_settings.certificates_id) {
      throw new Error('Certificado digital não configurado. Por favor, configure o certificado primeiro.');
    }

    // Atualizar status para processando
    const { error: updateError } = await supabaseClient
      .from('nfse')
      .update({ 
        status_sefaz: 'processando',
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseData.nfseId);

    if (updateError) throw updateError;

    // Registrar log de início do processamento
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseData.nfseId,
        status: 'processando',
        message: 'Iniciando transmissão para SEFAZ',
        request_payload: { nfseId: nfseData.nfseId },
      });

    // TODO: Implementar integração real com a SEFAZ
    // Por enquanto, simular processamento bem-sucedido após 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Atualizar NFS-e como autorizada
    await supabaseClient
      .from('nfse')
      .update({
        status_sefaz: 'autorizada',
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseData.nfseId);

    // Registrar log de sucesso
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseData.nfseId,
        status: 'sucesso',
        message: 'NFS-e transmitida com sucesso',
        response_payload: { success: true },
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'NFS-e transmitida com sucesso'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );

  } catch (error) {
    console.error('Erro ao transmitir NFS-e:', error);

    // Registrar log de erro
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseData.nfseId,
        status: 'erro',
        message: error.message,
        response_payload: { error: error.message },
      });

    // Atualizar status da NFS-e para rejeitada em caso de erro
    await supabaseClient
      .from('nfse')
      .update({ 
        status_sefaz: 'rejeitada',
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseData.nfseId);

    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );
  }
});
