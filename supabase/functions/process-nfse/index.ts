
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import forge from "npm:node-forge";

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

    // Primeiro, buscar NFS-e com suas configurações
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        nfse_sp_settings!nfse_sp_settings_id (
          *,
          certificates!certificates_id (
            certificate_data,
            certificate_password
          )
        )
      `)
      .eq('id', nfseId)
      .maybeSingle();

    if (nfseError) {
      console.error('Erro ao buscar NFS-e:', nfseError);
      throw new Error('Erro ao buscar NFS-e');
    }

    if (!nfse) {
      throw new Error('NFS-e não encontrada');
    }

    if (!nfse.nfse_sp_settings) {
      throw new Error('Configurações da NFS-e não encontradas');
    }

    const settings = nfse.nfse_sp_settings;

    // Verificar status atual
    const response = await fetch(
      settings.ambiente === 'producao'
        ? 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx'
        : 'https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFe',
        },
        body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <MensagemXML>
        <![CDATA[
          <?xml version="1.0" encoding="UTF-8"?>
          <ConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
            <Cabecalho Versao="1">
              <CPFCNPJRemetente>
                <CNPJ>${settings.cnpj}</CNPJ>
              </CPFCNPJRemetente>
            </Cabecalho>
            <Detalhe>
              <ChaveNFe>
                <InscricaoPrestador>${settings.inscricao_municipal}</InscricaoPrestador>
                <NumeroNFe>${nfse.numero_nfse}</NumeroNFe>
              </ChaveNFe>
            </Detalhe>
          </ConsultaNFe>
        ]]>
      </MensagemXML>
    </ConsultaNFe>
  </soap:Body>
</soap:Envelope>`
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na consulta à SEFAZ: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('Resposta da consulta:', responseText);

    // Processar resposta e atualizar status
    let novoStatus = 'processando';
    if (responseText.includes('<Situacao>C</Situacao>')) {
      novoStatus = 'cancelada';
    } else if (responseText.includes('<Situacao>N</Situacao>')) {
      novoStatus = 'autorizada';
    } else if (responseText.includes('<Erro>')) {
      novoStatus = 'rejeitada';
    }

    // Atualizar status da NFS-e
    const { error: updateError } = await supabaseClient
      .from('nfse')
      .update({
        status_sefaz: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseId);

    if (updateError) {
      throw updateError;
    }

    // Registrar log
    await supabaseClient
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseId,
        status: novoStatus,
        request_payload: { xml: responseText },
        response_payload: { xml: responseText }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: novoStatus,
        message: `Status da NFS-e atualizado para ${novoStatus}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao processar NFS-e:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
