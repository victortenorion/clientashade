
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

async function createSoapEnvelope(nfse: any, settings: any, certificate: any) {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Header>
    <HeaderEnvio xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <CertificadoDigital>${certificate.certificate_data}</CertificadoDigital>
      <Usuario>${settings.usuario_emissor}</Usuario>
      <Senha>${settings.senha_emissor}</Senha>
    </HeaderEnvio>
  </soap:Header>
  <soap:Body>
    <EnvioRPS xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>2.00</VersaoSchema>
      <MensagemXML>
        <![CDATA[
          <?xml version="1.0" encoding="UTF-8"?>
          <PedidoEnvioRPS xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.prefeitura.sp.gov.br/nfe">
            <Cabecalho Versao="2.00">
              <CPFCNPJRemetente>
                <CNPJ>${nfse.clients.document.replace(/\D/g, '')}</CNPJ>
              </CPFCNPJRemetente>
            </Cabecalho>
            <RPS>
              <Assinatura>${/* TODO: Gerar assinatura */}</Assinatura>
              <ChaveRPS>
                <InscricaoPrestador>${settings.inscricao_municipal}</InscricaoPrestador>
                <SerieRPS>${nfse.serie_rps || '1'}</SerieRPS>
                <NumeroRPS>${nfse.numero_rps}</NumeroRPS>
              </ChaveRPS>
              <TipoRPS>${nfse.tipo_rps || 'RPS'}</TipoRPS>
              <DataEmissao>${new Date(nfse.data_emissao).toISOString().split('T')[0]}</DataEmissao>
              <StatusRPS>N</StatusRPS>
              <TributacaoRPS>${nfse.tributacao_rps || 'T'}</TributacaoRPS>
              <ValorServicos>${nfse.valor_servicos}</ValorServicos>
              <ValorDeducoes>${nfse.valor_deducoes || 0}</ValorDeducoes>
              <CodigoServico>${nfse.codigo_servico}</CodigoServico>
              <AliquotaServicos>${(nfse.aliquota_servicos || 0).toFixed(4)}</AliquotaServicos>
              <ISSRetido>${nfse.iss_retido ? 'true' : 'false'}</ISSRetido>
              <CPFCNPJTomador>
                <CNPJ>${nfse.clients.document.replace(/\D/g, '')}</CNPJ>
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
                <CEP>${nfse.clients.zip_code.replace(/\D/g, '')}</CEP>
              </EnderecoTomador>
              <EmailTomador>${nfse.clients.email || ''}</EmailTomador>
              <Discriminacao>${nfse.discriminacao_servicos}</Discriminacao>
            </RPS>
          </PedidoEnvioRPS>
        ]]>
      </MensagemXML>
    </EnvioRPS>
  </soap:Body>
</soap:Envelope>`;

  return envelope;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let nfseData: NFSeData;
  try {
    nfseData = await req.json() as NFSeData;
  } catch (error) {
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

    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        clients (*),
        nfse_sp_settings (
          *,
          certificates:certificates_id (*)
        )
      `)
      .eq('id', nfseData.nfseId)
      .single();

    if (nfseError) throw nfseError;
    if (!nfse) throw new Error('NFS-e não encontrada');

    console.log('Verificando configurações...');

    if (!nfse.nfse_sp_settings) {
      throw new Error('Configurações da NFS-e SP não encontradas. Por favor, configure primeiro.');
    }

    if (!nfse.nfse_sp_settings.certificates_id) {
      throw new Error('Certificado digital não configurado. Por favor, configure o certificado primeiro.');
    }

    if (nfse.status_sefaz === 'autorizada') {
      throw new Error('NFS-e já está autorizada');
    }

    if (nfse.cancelada) {
      throw new Error('NFS-e está cancelada');
    }

    console.log('Preparando requisição SOAP...');

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

    // Criar envelope SOAP
    const soapEnvelope = await createSoapEnvelope(
      nfse, 
      nfse.nfse_sp_settings,
      nfse.nfse_sp_settings.certificates
    );

    console.log('Enviando requisição para SEFAZ...');

    // Determinar URL baseado no ambiente
    const url = nfse.nfse_sp_settings.ambiente === 'producao' 
      ? nfse.nfse_sp_settings.wsdl_producao 
      : nfse.nfse_sp_settings.wsdl_homologacao;

    // Enviar requisição SOAP
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/envioRPS',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`Erro na chamada à SEFAZ: ${response.status} ${response.statusText}`);
    }

    const xmlResponse = await response.text();
    console.log('Resposta da SEFAZ:', xmlResponse);

    // Parsear resposta XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlResponse, 'text/xml');
    
    // Verificar se há erro na resposta
    const erro = xmlDoc.querySelector('Erro');
    if (erro) {
      throw new Error(`Erro SEFAZ: ${erro.textContent}`);
    }

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
        response_payload: { xmlResponse },
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
