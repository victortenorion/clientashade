import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

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
    console.log('Buscando dados da NFS-e:', nfseData.nfseId);

    // Primeiro, buscar as configurações SP
    const { data: settings, error: settingsError } = await supabaseClient
      .from('nfse_sp_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Erro ao buscar configurações:', settingsError);
      throw new Error('Erro ao buscar configurações da NFS-e SP');
    }

    if (!settings) {
      console.error('Nenhuma configuração encontrada');
      throw new Error('Configurações da NFS-e SP não encontradas. Por favor, configure primeiro.');
    }

    console.log('Configurações encontradas:', settings.id);

    // Agora buscar a NFS-e com as configurações
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .update({ 
        nfse_sp_settings_id: settings.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseData.nfseId)
      .select(`
        *,
        clients (*),
        nfse_sp_settings!inner (
          *,
          certificates:certificates_id (*)
        )
      `)
      .single();

    if (nfseError) {
      console.error('Erro ao buscar NFS-e:', nfseError);
      throw nfseError;
    }

    if (!nfse) {
      console.error('NFS-e não encontrada');
      throw new Error('NFS-e não encontrada');
    }

    console.log('NFS-e encontrada:', nfse.id);

    if (!nfse.nfse_sp_settings) {
      console.error('Configurações não vinculadas à NFS-e');
      throw new Error('Configurações da NFS-e SP não vinculadas corretamente.');
    }

    if (!nfse.nfse_sp_settings.certificates) {
      console.error('Certificado não encontrado');
      throw new Error('Certificado digital não configurado. Por favor, configure o certificado primeiro.');
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
        request_payload: { nfseId: nfseData.nfseId },
      });

    console.log('Preparando envelope SOAP...');

    // Criar envelope SOAP (mock por enquanto)
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
      <Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
        <Body>
          <EnvioRPSRequest>
            <!-- Dados do RPS aqui -->
          </EnvioRPSRequest>
        </Body>
      </Envelope>`;

    console.log('Enviando requisição para SEFAZ...');

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
    console.error('Erro ao transmitir NFS-e:', error);

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
