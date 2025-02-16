
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

    // Buscar NFS-e com suas configurações em uma única query
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        nfse_sp_settings!inner (
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

    const settings = nfse.nfse_sp_settings;
    if (!settings) {
      throw new Error('Configurações da NFS-e não encontradas');
    }

    const endpoint = settings.ambiente === 'producao'
      ? 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx'
      : 'https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx';

    console.log('Tentando acessar endpoint:', endpoint);

    // Configurar payload SOAP
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
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
</soap:Envelope>`;

    console.log('Enviando requisição SOAP:', soapEnvelope);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFe',
          'Accept': '*/*'
        },
        body: soapEnvelope,
        // Adicionar opções para lidar com certificados auto-assinados em desenvolvimento
        ...(settings.ambiente === 'homologacao' && {
          //@ts-ignore - Deno suporta essa opção mas o TS não reconhece
          rejectUnauthorized: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta da SEFAZ:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Erro na consulta à SEFAZ: ${response.status} - ${response.statusText}`);
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
          request_payload: { xml: soapEnvelope },
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
    } catch (fetchError) {
      console.error('Erro na requisição SOAP:', fetchError);
      throw new Error(`Erro na comunicação com a SEFAZ: ${fetchError.message}`);
    }

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
