
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

    // Modificada a query para usar subquery e pegar apenas o certificado mais recente
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        nfse_sp_settings!inner (
          *,
          certificates:certificates (
            certificate_data,
            certificate_password
          )
        ),
        company_info (
          cnpj,
          inscricao_municipal
        )
      `)
      .eq('id', nfseId)
      .order('created_at.desc', { foreignTable: 'nfse_sp_settings.certificates' })
      .limit(1, { foreignTable: 'nfse_sp_settings.certificates' })
      .maybeSingle();

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
      settings: nfse.nfse_sp_settings ? 'presente' : 'ausente',
      company_info: nfse.company_info ? 'presente' : 'ausente'
    });

    const settings = nfse.nfse_sp_settings?.[0];
    if (!settings) {
      throw new Error('Configurações da NFS-e não encontradas');
    }

    const companyInfo = nfse.company_info?.[0];
    if (!companyInfo) {
      throw new Error('Informações da empresa não encontradas');
    }

    if (!companyInfo.cnpj || !companyInfo.inscricao_municipal) {
      throw new Error('CNPJ ou Inscrição Municipal não configurados');
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
                <CNPJ>${companyInfo.cnpj}</CNPJ>
              </CPFCNPJRemetente>
            </Cabecalho>
            <Detalhe>
              <ChaveNFe>
                <InscricaoPrestador>${companyInfo.inscricao_municipal}</InscricaoPrestador>
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
      // Usar o cliente HTTP nativo do Deno
      const conn = await Deno.connect({ hostname: settings.ambiente === 'producao' ? 'nfe.prefeitura.sp.gov.br' : 'nfeh.prefeitura.sp.gov.br', port: 443 });
      const tlsConn = await Deno.startTls(conn, {
        hostname: settings.ambiente === 'producao' ? 'nfe.prefeitura.sp.gov.br' : 'nfeh.prefeitura.sp.gov.br',
        // Em homologação, não validamos o certificado
        certFile: settings.ambiente === 'producao' ? undefined : null
      });

      const requestHeaders = [
        'POST /ws/lotenfe.asmx HTTP/1.1',
        `Host: ${settings.ambiente === 'producao' ? 'nfe.prefeitura.sp.gov.br' : 'nfeh.prefeitura.sp.gov.br'}`,
        'Content-Type: text/xml;charset=UTF-8',
        'SOAPAction: http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFe',
        'Accept: */*',
        `Content-Length: ${soapEnvelope.length}`,
        '',
        soapEnvelope
      ].join('\r\n');

      const encoder = new TextEncoder();
      await tlsConn.write(encoder.encode(requestHeaders));

      // Ler a resposta
      const decoder = new TextDecoder();
      const buffer = new Uint8Array(10000);
      const bytesRead = await tlsConn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, bytesRead!));

      tlsConn.close();
      conn.close();

      console.log('Resposta da consulta:', response);

      // Extrair o corpo da resposta HTTP
      const responseBody = response.split('\r\n\r\n')[1] || '';

      // Processar resposta e atualizar status
      let novoStatus = 'processando';
      if (responseBody.includes('<Situacao>C</Situacao>')) {
        novoStatus = 'cancelada';
      } else if (responseBody.includes('<Situacao>N</Situacao>')) {
        novoStatus = 'autorizada';
      } else if (responseBody.includes('<Erro>')) {
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
          response_payload: { xml: responseBody }
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
