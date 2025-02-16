
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

async function signXML(xml: string, certificateData: string, certificatePassword: string): Promise<string> {
  try {
    // Decodificar certificado
    const certificadoBase64 = certificateData.includes('base64,') 
      ? certificateData.split('base64,')[1]
      : certificateData;

    const binaryString = atob(certificadoBase64);
    const der = forge.util.createBuffer(binaryString, 'binary');
    const asn1 = forge.asn1.fromDer(der);
    const pkcs12 = forge.pkcs12.pkcs12FromAsn1(asn1, certificatePassword);

    // Extrair chave privada
    const keyBags = pkcs12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (!keyBags || !keyBags[0]) {
      throw new Error('Chave privada não encontrada no certificado');
    }
    const privateKey = keyBags[0].key;

    // Calcular hash do XML
    const md = forge.md.sha1.create();
    md.update(xml, 'utf8');
    const hash = md.digest().bytes();

    // Assinar o hash
    const signature = privateKey.sign(md);
    const signatureBase64 = forge.util.encode64(signature);

    return signatureBase64;
  } catch (error) {
    console.error('Erro ao assinar XML:', error);
    throw error;
  }
}

async function sendToSEFAZ(xml: string, ambiente: string): Promise<any> {
  const wsdlUrl = ambiente === 'producao'
    ? 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx'
    : 'https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx';

  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Body>
    <EnvioRPS xmlns="http://www.prefeitura.sp.gov.br/nfe">
      ${xml}
    </EnvioRPS>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await fetch(wsdlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/envioRPS'
      },
      body: soapEnvelope
    });

    if (!response.ok) {
      throw new Error(`Erro na chamada SOAP: ${response.statusText}`);
    }

    const responseText = await response.text();
    return responseText;
  } catch (error) {
    console.error('Erro ao enviar para SEFAZ:', error);
    throw error;
  }
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

    // Buscar dados da NFS-e
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        clients (
          *
        ),
        nfse_sp_settings (
          *
        )
      `)
      .eq('id', nfseId)
      .single();

    if (nfseError) throw nfseError;

    // Buscar certificado
    const { data: certificate, error: certError } = await supabaseClient
      .from('certificates')
      .select('*')
      .eq('id', nfse.nfse_sp_settings.certificado_id)
      .single();

    if (certError) throw certError;

    // Gerar o XML do RPS
    const xmlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioRPS xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho Versao="1" xmlns="">
    <CPFCNPJRemetente>
      <CNPJ>${nfse.cnpj}</CNPJ>
    </CPFCNPJRemetente>
  </Cabecalho>
  <RPS xmlns="">
    <ChaveRPS>
      <InscricaoPrestador>${nfse.inscricao_municipal}</InscricaoPrestador>
      <SerieRPS>${nfse.serie_rps}</SerieRPS>
      <NumeroRPS>${nfse.numero_rps}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>RPS</TipoRPS>
    <DataEmissao>${nfse.data_emissao}</DataEmissao>
    <StatusRPS>N</StatusRPS>
    <TributacaoRPS>T</TributacaoRPS>
    <ValorServicos>${nfse.valor_servicos}</ValorServicos>
    <ValorDeducoes>0.00</ValorDeducoes>
    <ValorPIS>0.00</ValorPIS>
    <ValorCOFINS>0.00</ValorCOFINS>
    <ValorINSS>0.00</ValorINSS>
    <ValorIR>0.00</ValorIR>
    <ValorCSLL>0.00</ValorCSLL>
    <CodigoServico>${nfse.codigo_servico}</CodigoServico>
    <AliquotaServicos>${nfse.aliquota_servico}</AliquotaServicos>
    <ISSRetido>false</ISSRetido>
    <CPFCNPJTomador>
      <CNPJ>${nfse.clients.document}</CNPJ>
    </CPFCNPJTomador>
    <RazaoSocialTomador>${nfse.clients.name}</RazaoSocialTomador>
    <EnderecoTomador>
      <TipoLogradouro>Rua</TipoLogradouro>
      <Logradouro>${nfse.clients.street}</Logradouro>
      <NumeroEndereco>${nfse.clients.street_number}</NumeroEndereco>
      <ComplementoEndereco>${nfse.clients.complement || ''}</ComplementoEndereco>
      <Bairro>${nfse.clients.neighborhood}</Bairro>
      <Cidade>${nfse.clients.city}</Cidade>
      <UF>${nfse.clients.state}</UF>
      <CEP>${nfse.clients.zip_code}</CEP>
    </EnderecoTomador>
    <EmailTomador>${nfse.clients.email}</EmailTomador>
    <Discriminacao>${nfse.discriminacao_servicos}</Discriminacao>
  </RPS>
</PedidoEnvioRPS>`;

    try {
      // Assinar XML
      console.log('Iniciando assinatura do XML...');
      const signature = await signXML(xmlTemplate, certificate.certificate_data, certificate.certificate_password);
      console.log('XML assinado com sucesso');

      // Atualizar XML com assinatura
      const xmlAssinado = xmlTemplate.replace('<RPS xmlns="">', `<RPS xmlns=""><Assinatura>${signature}</Assinatura>`);

      // Enviar para SEFAZ
      console.log('Enviando para SEFAZ...');
      const sefazResponse = await sendToSEFAZ(xmlAssinado, nfse.ambiente);
      console.log('Resposta SEFAZ:', sefazResponse);

      // Atualizar status e salvar XML
      await supabaseClient
        .from('nfse')
        .update({
          xml_envio: xmlAssinado,
          xml_retorno: sefazResponse,
          status_sefaz: 'processando'
        })
        .eq('id', nfseId);

      // Registrar log
      await supabaseClient
        .from('nfse_sefaz_logs')
        .insert({
          nfse_id: nfseId,
          status: 'enviado',
          message: 'NFS-e enviada para SEFAZ',
          request_payload: xmlAssinado,
          response_payload: sefazResponse
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'NFS-e enviada para SEFAZ com sucesso'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } catch (error) {
      // Registrar erro no log
      await supabaseClient
        .from('nfse_sefaz_logs')
        .insert({
          nfse_id: nfseId,
          status: 'erro',
          message: error.message
        });

      throw error;
    }

  } catch (error) {
    console.error('Erro ao processar NFS-e:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
