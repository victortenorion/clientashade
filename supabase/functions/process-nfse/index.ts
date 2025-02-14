
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

    // Get NFSe data
    const { data: nfse, error: nfseError } = await supabase
      .from('nfse')
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
      .eq('id', nfseId)
      .limit(1)
      .single();

    if (nfseError) throw nfseError;
    if (!nfse) throw new Error('NFS-e não encontrada');

    // Get company info
    const { data: companyInfo, error: companyError } = await supabase
      .from('company_info')
      .select('*')
      .limit(1)
      .single();

    if (companyError) throw companyError;
    if (!companyInfo) throw new Error('Informações da empresa não configuradas');

    // Get certificate
    const { data: nfseConfig, error: configError } = await supabase
      .from('nfse_config')
      .select('*')
      .limit(1)
      .single();

    if (configError) throw configError;
    if (!nfseConfig) throw new Error('Configurações da NFS-e não encontradas');

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
      permiteEmissaoSemCertificado: nfseConfig.permite_emissao_sem_certificado
    });

    // In a real implementation, here you would:
    // 1. Generate the XML
    // 2. Sign it with the certificate (if required)
    // 3. Send to SEFAZ
    // 4. Process the response
    // For now, we'll simulate success

    // Update NFSe status
    const { error: updateError } = await supabase
      .from('nfse')
      .update({
        status_sefaz: 'processado',
        numero_nfse: nfse.numero_nfse
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
      JSON.stringify({ success: true }),
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
