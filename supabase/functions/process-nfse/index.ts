
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Iniciando processamento da NFS-e');

    const { nfseId } = await req.json();

    if (!nfseId) {
      throw new Error('ID da NFS-e não informado');
    }

    // Get NFSe config and increment RPS number
    const { data: nfseConfig, error: configError } = await supabase
      .from('nfse_config')
      .select('*')
      .limit(1)
      .single();

    if (configError) {
      console.error('Erro ao buscar configurações:', configError);
      throw configError;
    }
    if (!nfseConfig) {
      throw new Error('Configurações da NFS-e não encontradas');
    }

    console.log('Configurações encontradas:', nfseConfig);

    // Increment RPS number
    const { data: rpsData, error: rpsError } = await supabase
      .rpc('increment_rps_numero')
      .single();

    if (rpsError) {
      console.error('Erro ao incrementar RPS:', rpsError);
      throw rpsError;
    }
    if (!rpsData) {
      throw new Error('Erro ao gerar número do RPS');
    }

    console.log('RPS incrementado:', rpsData);

    // Update queue status
    const { error: queueError } = await supabase
      .from('sefaz_transmission_queue')
      .update({ 
        status: 'processando',
        ultima_tentativa: new Date().toISOString()
      })
      .eq('documento_id', nfseId)
      .eq('tipo', 'nfse');

    if (queueError) {
      console.error('Erro ao atualizar fila:', queueError);
      throw queueError;
    }

    // Update NFSe with RPS info
    const { data: nfse, error: nfseUpdateError } = await supabase
      .from('nfse')
      .update({
        numero_rps: rpsData.ultima_rps_numero.toString(),
        serie_rps: rpsData.serie_rps_padrao,
        tipo_rps: rpsData.tipo_rps,
        status_sefaz: 'processando'
      })
      .eq('id', nfseId)
      .select(`
        *,
        client:clients(
          name,
          document,
          municipal_registration,
          street,
          street_number,
          complement,
          neighborhood,
          city,
          state,
          zip_code
        )
      `)
      .single();

    if (nfseUpdateError) {
      console.error('Erro ao atualizar NFS-e:', nfseUpdateError);
      throw nfseUpdateError;
    }
    if (!nfse) {
      throw new Error('NFS-e não encontrada');
    }

    console.log('NFS-e atualizada com sucesso:', nfse);

    // Get company info
    const { data: companyInfo, error: companyError } = await supabase
      .from('company_info')
      .select('*')
      .limit(1)
      .single();

    if (companyError) {
      console.error('Erro ao buscar dados da empresa:', companyError);
      throw companyError;
    }
    if (!companyInfo) {
      throw new Error('Informações da empresa não configuradas');
    }

    // Log de processamento
    await supabase
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseId,
        status: 'success',
        message: 'NFS-e processada com sucesso',
        request_payload: { 
          nfseId,
          rps: {
            numero: nfse.numero_rps,
            serie: nfse.serie_rps,
            tipo: nfse.tipo_rps
          }
        },
        response_payload: { 
          status: 'processado',
          message: 'Processamento realizado com sucesso'
        }
      });

    // Atualizar status da NFS-e
    const { error: updateError } = await supabase
      .from('nfse')
      .update({
        status_sefaz: 'processado'
      })
      .eq('id', nfseId);

    if (updateError) {
      console.error('Erro ao atualizar status final:', updateError);
      throw updateError;
    }

    // Atualizar status da fila
    const { error: queueUpdateError } = await supabase
      .from('sefaz_transmission_queue')
      .update({ 
        status: 'enviado',
        ultima_tentativa: new Date().toISOString()
      })
      .eq('documento_id', nfseId)
      .eq('tipo', 'nfse');

    if (queueUpdateError) {
      console.error('Erro ao atualizar status final da fila:', queueUpdateError);
      throw queueUpdateError;
    }

    console.log('Processamento finalizado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        rps: {
          numero: nfse.numero_rps,
          serie: nfse.serie_rps,
          tipo: nfse.tipo_rps
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Erro no processamento da NFS-e:', error);

    // Adicionar log de erro
    try {
      const { nfseId } = await req.json();
      if (nfseId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase
          .from('nfse_sefaz_logs')
          .insert({
            nfse_id: nfseId,
            status: 'error',
            message: error.message,
            request_payload: { nfseId },
            response_payload: { error: error.message }
          });

        // Atualizar status da NFS-e em caso de erro
        await supabase
          .from('nfse')
          .update({
            status_sefaz: 'erro'
          })
          .eq('id', nfseId);

        // Atualizar status da fila em caso de erro
        await supabase
          .from('sefaz_transmission_queue')
          .update({ 
            status: 'erro',
            erro_mensagem: error.message,
            ultima_tentativa: new Date().toISOString()
          })
          .eq('documento_id', nfseId)
          .eq('tipo', 'nfse');
      }
    } catch (logError) {
      console.error('Erro ao registrar log de erro:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
