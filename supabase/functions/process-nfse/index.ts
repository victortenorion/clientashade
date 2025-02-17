
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
    return new Response('ok', { headers: corsHeaders });
  }

  let nfseData: NFSeData;
  try {
    nfseData = await req.json() as NFSeData;
  } catch (error) {
    console.error('Erro ao ler dados da requisição:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao ler dados da requisição' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Iniciando processamento da NFS-e:', nfseData.nfseId);

    // Buscar a NFS-e e suas configurações em uma única query
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        client:client_id (*),
        settings:nfse_sp_settings!inner (
          *,
          certificate:certificates_id (*)
        )
      `)
      .eq('id', nfseData.nfseId)
      .maybeSingle();

    if (nfseError) {
      console.error('Erro ao buscar NFS-e:', nfseError);
      throw new Error(`Erro ao buscar NFS-e: ${nfseError.message}`);
    }

    if (!nfse) {
      console.error('NFS-e não encontrada');
      throw new Error('NFS-e não encontrada');
    }

    console.log('NFS-e encontrada:', {
      id: nfse.id,
      hasSettings: !!nfse.settings,
      hasCertificate: !!(nfse.settings?.certificate),
      status: nfse.status_sefaz
    });

    if (!nfse.settings) {
      console.error('Configurações não encontradas');
      throw new Error('Configurações da NFS-e SP não encontradas. Por favor, configure primeiro.');
    }

    if (!nfse.settings.certificate) {
      console.error('Certificado não encontrado');
      throw new Error('Certificado digital não configurado. Por favor, configure o certificado primeiro.');
    }

    // Verificar se todos os campos obrigatórios estão preenchidos
    const requiredFields = [
      'usuario_emissor',
      'senha_emissor',
      'ambiente',
      'inscricao_municipal'
    ];

    const missingFields = requiredFields.filter(field => !nfse.settings[field]);
    if (missingFields.length > 0) {
      console.error('Campos obrigatórios faltando:', missingFields);
      throw new Error(`Campos obrigatórios não configurados: ${missingFields.join(', ')}`);
    }

    if (nfse.status_sefaz === 'autorizada') {
      console.error('NFS-e já autorizada');
      throw new Error('NFS-e já está autorizada');
    }

    if (nfse.cancelada) {
      console.error('NFS-e cancelada');
      throw new Error('NFS-e está cancelada');
    }

    // Atualizar status para processando
    await supabaseClient
      .from('nfse')
      .update({ 
        status_sefaz: 'processando',
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseData.nfseId);

    // Registrar início do processamento
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseData.nfseId,
        status: 'processando',
        message: 'Iniciando transmissão para SEFAZ',
        request_payload: { 
          nfseId: nfseData.nfseId,
          ambiente: nfse.settings.ambiente
        },
      });

    console.log('Preparando dados para transmissão...');

    // Mock da resposta por enquanto
    const mockResponse = {
      success: true,
      protocol: '12345',
      message: 'NFS-e processada com sucesso'
    };

    // Atualizar NFS-e como autorizada
    await supabaseClient
      .from('nfse')
      .update({
        status_sefaz: 'autorizada',
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseData.nfseId);

    // Registrar sucesso
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseData.nfseId,
        status: 'sucesso',
        message: 'NFS-e transmitida com sucesso',
        response_payload: mockResponse,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'NFS-e transmitida com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no processamento da NFS-e:', error);

    // Registrar erro
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseData.nfseId,
        status: 'erro',
        message: error.message,
        response_payload: { error: error.message },
      });

    // Atualizar status para rejeitada
    await supabaseClient
      .from('nfse')
      .update({ 
        status_sefaz: 'rejeitada',
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseData.nfseId);

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
