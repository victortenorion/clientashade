
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

    // Buscar a NFS-e
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select('*, client:client_id (*)')
      .eq('id', nfseData.nfseId)
      .maybeSingle();

    if (nfseError) throw new Error(`Erro ao buscar NFS-e: ${nfseError.message}`);
    if (!nfse) throw new Error('NFS-e não encontrada');

    // Buscar configurações SP e número inicial
    const { data: spConfig, error: spConfigError } = await supabaseClient
      .from('nfse_sp_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (spConfigError) throw new Error('Erro ao buscar configuração de números iniciais');
    if (!spConfig) throw new Error('Configuração de números iniciais não encontrada');

    console.log('Configurações SP:', {
      numero_inicial_rps: spConfig.numero_inicial_rps,
      numero_inicial_nfse: spConfig.numero_inicial_nfse
    });

    // Validar número RPS
    if (parseInt(nfse.numero_rps) < spConfig.numero_inicial_rps) {
      throw new Error(`O número RPS ${nfse.numero_rps} é menor que o número inicial configurado ${spConfig.numero_inicial_rps}`);
    }

    // Validar número NFSe
    if (spConfig.numero_inicial_nfse && nfse.numero_nfse < parseInt(spConfig.numero_inicial_nfse)) {
      console.error('Número NFSe inválido:', {
        numero_nfse: nfse.numero_nfse,
        numero_inicial_nfse: spConfig.numero_inicial_nfse
      });

      // Atualizar o número da NFSe para respeitar o número inicial
      const { error: updateNFSeError } = await supabaseClient
        .from('nfse')
        .update({ 
          numero_nfse: parseInt(spConfig.numero_inicial_nfse),
          updated_at: new Date().toISOString()
        })
        .eq('id', nfseData.nfseId);

      if (updateNFSeError) {
        throw new Error(`Erro ao atualizar número da NFS-e: ${updateNFSeError.message}`);
      }

      console.log('Número da NFSe atualizado para respeitar número inicial:', spConfig.numero_inicial_nfse);
    }

    // Buscar o certificado
    const { data: certificate, error: certError } = await supabaseClient
      .from('certificates')
      .select('*')
      .eq('type', 'nfse')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (certError) throw new Error('Erro ao buscar certificado digital');
    if (!certificate) throw new Error('Certificado digital não encontrado. Por favor, faça o upload do certificado primeiro.');
    if (!certificate.is_valid) throw new Error('Certificado digital inválido ou expirado. Por favor, verifique a validade do certificado.');

    // Buscar configurações SP
    const { data: settings, error: settingsError } = await supabaseClient
      .from('nfse_sp_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsError) throw new Error('Erro ao buscar configurações da NFS-e SP');
    if (!settings) throw new Error('Configurações da NFS-e SP não encontradas. Por favor, configure primeiro.');

    // Atualizar o certificates_id nas configurações se necessário
    if (settings.certificates_id !== certificate.id) {
      const { error: updateSettingsError } = await supabaseClient
        .from('nfse_sp_settings')
        .update({ 
          certificates_id: certificate.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (updateSettingsError) throw new Error('Erro ao vincular certificado às configurações');
    }

    // Verificar campos obrigatórios
    const requiredFields = ['usuario_emissor', 'senha_emissor', 'ambiente', 'inscricao_municipal'];
    const missingFields = requiredFields.filter(field => !settings[field]);
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios não configurados: ${missingFields.join(', ')}`);
    }

    if (nfse.status_sefaz === 'autorizada') throw new Error('NFS-e já está autorizada');
    if (nfse.cancelada) throw new Error('NFS-e está cancelada');

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
          ambiente: settings.ambiente,
          settingsId: settings.id,
          certificateId: certificate.id,
          numero_rps: nfse.numero_rps,
          numero_nfse: nfse.numero_nfse,
          numero_inicial_rps: spConfig.numero_inicial_rps,
          numero_inicial_nfse: spConfig.numero_inicial_nfse
        },
      });

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
