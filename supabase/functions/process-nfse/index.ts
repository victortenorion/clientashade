
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

    // Usando RPC para buscar a NFS-e com o certificado mais recente
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
      company_info: nfse.company_info ? 'presente' : 'ausente',
      certificate: nfse.settings?.certificate ? 'presente' : 'ausente'
    });

    if (!nfse.settings) {
      throw new Error('Configurações da NFS-e não encontradas');
    }

    if (!nfse.company_info) {
      throw new Error('Informações da empresa não encontradas');
    }

    if (!nfse.settings.certificate) {
      throw new Error('Certificado digital não encontrado');
    }

    if (!nfse.settings.certificate.certificate_data || !nfse.settings.certificate.certificate_password) {
      throw new Error('Dados do certificado digital incompletos');
    }

    if (!nfse.company_info.cnpj || !nfse.company_info.inscricao_municipal) {
      throw new Error('CNPJ ou Inscrição Municipal não configurados');
    }

    const endpoint = nfse.settings.ambiente === 'producao'
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
                <CNPJ>${nfse.company_info.cnpj}</CNPJ>
              </CPFCNPJRemetente>
            </Cabecalho>
            <Detalhe>
              <ChaveNFe>
                <InscricaoPrestador>${nfse.company_info.inscricao_municipal}</InscricaoPrestador>
                <NumeroNFe>${nfse.numero_nfse}</NumeroNFe>
              </ChaveNFe>
            </Detalhe>
          </ConsultaNFe>
        ]]>
      </MensagemXML>
    </ConsultaNFe>
  </soap:Body>
</soap:Envelope>`;

    console.log('Enviando requisição SOAP com certificado digital');

    try {
      // Decodificar o certificado base64
      const certificateData = atob(nfse.settings.certificate.certificate_data);
      const certificatePassword = nfse.settings.certificate.certificate_password;

      // Criar um buffer do certificado
      const certBuffer = new Uint8Array(certificateData.length);
      for (let i = 0; i < certificateData.length; i++) {
        certBuffer[i] = certificateData.charCodeAt(i);
      }

      // Preparar as opções da requisição com o certificado
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFe',
        },
        body: soapEnvelope,
        // Adicionar o certificado para autenticação mútua
        cert: certBuffer,
        key: certBuffer,
        passphrase: certificatePassword,
      };

      console.log('Enviando requisição com certificado configurado');
      
      const response = await fetch(endpoint, requestOptions);

      if (!response.ok) {
        console.error('Erro na resposta HTTP:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
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
