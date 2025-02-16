
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

    console.log('Buscando NFS-e com ID:', nfseId);

    const { data: nfse, error: nfseError } = await supabaseClient.rpc(
      'get_nfse_with_latest_certificate',
      { p_nfse_id: nfseId }
    );

    if (nfseError) {
      console.error('Erro ao buscar NFS-e:', nfseError);
      throw new Error(`Erro ao buscar NFS-e: ${nfseError.message}`);
    }

    if (!nfse) {
      throw new Error('NFS-e não encontrada');
    }

    console.log('NFS-e encontrada:', {
      id: nfse.id,
      numero: nfse.numero_nfse,
      settings: nfse.settings ? 'presente' : 'ausente',
      company_info: nfse.company_info ? 'presente' : 'ausente'
    });

    if (!nfse.settings) {
      throw new Error('Configurações da NFS-e não encontradas');
    }

    if (!nfse.company_info) {
      throw new Error('Informações da empresa não encontradas');
    }

    if (!nfse.company_info.cnpj || !nfse.company_info.inscricao_municipal) {
      throw new Error('CNPJ ou Inscrição Municipal não configurados');
    }

    const endpoint = nfse.settings.ambiente === 'producao'
      ? 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx'
      : 'https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx';

    console.log('Tentando acessar endpoint:', endpoint);
    console.log('Ambiente:', nfse.settings.ambiente);

    const cnpjLimpo = nfse.company_info.cnpj.replace(/\D/g, '');
    const inscricaoMunicipalLimpa = nfse.company_info.inscricao_municipal.replace(/\D/g, '');

    console.log('CNPJ formatado:', cnpjLimpo);
    console.log('Inscrição Municipal formatada:', inscricaoMunicipalLimpa);

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <ConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>1</VersaoSchema>
      <MensagemXML>
        <![CDATA[<?xml version="1.0" encoding="UTF-8"?>
        <ConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <Cabecalho Versao="1">
            <CPFCNPJRemetente>
              <CNPJ>${cnpjLimpo}</CNPJ>
            </CPFCNPJRemetente>
          </Cabecalho>
          <Detalhe>
            <ChaveNFe>
              <InscricaoPrestador>${inscricaoMunicipalLimpa}</InscricaoPrestador>
              <NumeroNFe>${nfse.numero_nfse}</NumeroNFe>
            </ChaveNFe>
          </Detalhe>
        </ConsultaNFe>]]>
      </MensagemXML>
    </ConsultaNFe>
  </soap12:Body>
</soap12:Envelope>`;

    console.log('Enviando requisição SOAP:', soapEnvelope);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Usando interface https nativa do Deno
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml;charset=UTF-8',
          'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFe',
          'Host': new URL(endpoint).host,
          'Connection': 'keep-alive'
        },
        body: soapEnvelope,
        signal: controller.signal,
        // Desabilitando verificação de certificado para teste
        //@ts-ignore
        backend: 'native',
        rejectUnauthorized: false
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta com erro da SEFAZ:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Resposta da consulta:', responseText);

      let novoStatus = 'processando';
      if (responseText.includes('<Situacao>C</Situacao>')) {
        novoStatus = 'cancelada';
      } else if (responseText.includes('<Situacao>N</Situacao>')) {
        novoStatus = 'autorizada';
      } else if (responseText.includes('<Erro>')) {
        novoStatus = 'rejeitada';
      }

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
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout na comunicação com a SEFAZ');
      }
      
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
