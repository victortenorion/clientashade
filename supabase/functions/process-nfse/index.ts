
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NFSeData {
  id: string;
  numero_nfse: number;
  client_id: string;
  valor_servicos: number;
  codigo_servico: string;
  discriminacao_servicos: string;
  data_competencia: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nfseId } = await req.json();

    if (!nfseId) {
      throw new Error('ID da NFS-e não informado');
    }

    // Get NFSe config and increment RPS number
    const { data: nfseConfig, error: configError } = await supabase
      .rpc('increment_rps_numero', { config_id: null })
      .single();

    if (configError) throw configError;
    if (!nfseConfig) throw new Error('Configurações da NFS-e não encontradas');

    // Update queue status
    const { error: queueError } = await supabase
      .from('sefaz_transmission_queue')
      .update({ 
        status: 'processando',
        ultima_tentativa: new Date().toISOString()
      })
      .eq('documento_id', nfseId)
      .eq('tipo', 'nfse');

    if (queueError) throw queueError;

    // Update NFSe with RPS info
    const { data: nfse, error: nfseUpdateError } = await supabase
      .from('nfse')
      .update({
        numero_rps: nfseConfig.ultima_rps_numero.toString(),
        serie_rps: nfseConfig.serie_rps_padrao,
        tipo_rps: nfseConfig.tipo_rps
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

    if (nfseUpdateError) throw nfseUpdateError;
    if (!nfse) throw new Error('NFS-e não encontrada');

    // Get company info
    const { data: companyInfo, error: companyError } = await supabase
      .from('company_info')
      .select('*')
      .limit(1)
      .single();

    if (companyError) throw companyError;
    if (!companyInfo) throw new Error('Informações da empresa não configuradas');

    // Verificar se precisa de certificado
    if (!nfseConfig.permite_emissao_sem_certificado) {
      if (!nfseConfig.certificado_digital) {
        throw new Error('Certificado digital não configurado');
      }
      if (!nfseConfig.certificado_valido) {
        throw new Error('Certificado digital inválido ou expirado');
      }
    }

    // Log the processing attempt
    console.log('Processing NFSe:', {
      nfseId,
      ambiente: nfseConfig.ambiente,
      certificadoValido: nfseConfig.certificado_valido,
      permiteEmissaoSemCertificado: nfseConfig.permite_emissao_sem_certificado,
      numeroRPS: nfse.numero_rps,
      serieRPS: nfse.serie_rps,
      tipoRPS: nfse.tipo_rps
    });

    // Update NFSe status
    const { error: updateError } = await supabase
      .from('nfse')
      .update({
        status_sefaz: 'processado'
      })
      .eq('id', nfseId);

    if (updateError) throw updateError;

    // Update queue status
    const { error: queueUpdateError } = await supabase
      .from('sefaz_transmission_queue')
      .update({ 
        status: 'enviado',
        ultima_tentativa: new Date().toISOString()
      })
      .eq('documento_id', nfseId)
      .eq('tipo', 'nfse');

    if (queueUpdateError) throw queueUpdateError;

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
    console.error('Error processing NFSe:', error);

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
