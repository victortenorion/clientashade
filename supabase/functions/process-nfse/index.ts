
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SOAPRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
  auth?: {
    username: string;
    password: string;
  };
}

async function makeSOAPRequest(config: SOAPRequest) {
  const headers = {
    ...config.headers,
    ...(config.auth && {
      'Authorization': 'Basic ' + btoa(`${config.auth.username}:${config.auth.password}`)
    })
  };

  const response = await fetch(config.url, {
    method: 'POST',
    headers,
    body: config.body
  });

  if (!response.ok) {
    throw new Error(`SOAP request failed: ${response.statusText}`);
  }

  const text = await response.text();
  return text;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nfseId } = await req.json();
    console.log(`Processing NFS-e ID: ${nfseId}`);

    // Fetch NFS-e data with settings and certificates
    const { data: nfse, error: nfseError } = await supabase
      .rpc('get_nfse_with_latest_certificate', { p_nfse_id: nfseId });

    if (nfseError) {
      console.error('Error fetching NFS-e:', nfseError);
      throw nfseError;
    }

    if (!nfse) {
      throw new Error('NFS-e não encontrada');
    }

    console.log('NFS-e data retrieved:', { 
      id: nfse.id,
      settings: {
        ...nfse.settings,
        certificate: '[REDACTED]'
      }
    });

    // Verify required data
    const { data: missingFields, error: verifyError } = await supabase
      .rpc('verify_nfse_required_data', { p_nfse_id: nfseId });

    if (verifyError) {
      console.error('Error verifying NFS-e data:', verifyError);
      throw verifyError;
    }

    if (missingFields && missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error(`Campos obrigatórios faltando: ${missingFields.map(f => f.missing_field).join(', ')}`);
    }

    // Construct SOAP envelope
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <EnviarLoteRps xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>1</VersaoSchema>
      <MensagemXML>
        <![CDATA[<?xml version="1.0" encoding="UTF-8"?>
        <PedidoEnvioLoteRPS xmlns="http://www.prefeitura.sp.gov.br/nfe">
          <Cabecalho>
            <CPFCNPJRemetente>
              <CNPJ>${nfse.company_info.cnpj}</CNPJ>
            </CPFCNPJRemetente>
            <transacao>true</transacao>
            <dtInicio>${new Date().toISOString().split('T')[0]}</dtInicio>
            <dtFim>${new Date().toISOString().split('T')[0]}</dtFim>
            <QtdRPS>1</QtdRPS>
            <ValorTotalServicos>${nfse.valor_servicos || 0}</ValorTotalServicos>
            <ValorTotalDeducoes>0</ValorTotalDeducoes>
          </Cabecalho>
        </PedidoEnvioLoteRPS>]]>
      </MensagemXML>
    </EnviarLoteRps>
  </soap:Body>
</soap:Envelope>`;

    const endpoint = nfse.settings.ambiente === 'producao' 
      ? nfse.settings.wsdl_producao 
      : nfse.settings.wsdl_homologacao;

    console.log(`Sending request to endpoint: ${endpoint}`);

    // Make SOAP request
    const soapResponse = await makeSOAPRequest({
      url: endpoint,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/envioLoteRPS'
      },
      body: soapEnvelope,
      auth: {
        username: nfse.settings.usuario_emissor,
        password: nfse.settings.senha_emissor
      }
    });

    console.log('SOAP Response received:', soapResponse);

    // Parse response and update status
    const success = !soapResponse.includes('Erro') && !soapResponse.includes('Reject');
    
    // Update NFS-e status and save response
    const { error: updateError } = await supabase
      .from('nfse')
      .update({
        status_sefaz: success ? 'autorizada' : 'rejeitada',
        xml_envio: soapEnvelope,
        xml_retorno: soapResponse,
        updated_at: new Date().toISOString()
      })
      .eq('id', nfseId);

    if (updateError) {
      console.error('Error updating NFS-e:', updateError);
      throw updateError;
    }

    // Log the operation
    await supabase
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseId,
        status: success ? 'autorizada' : 'rejeitada',
        message: success ? 'Processamento realizado com sucesso' : 'Erro no processamento',
        request_payload: soapEnvelope,
        response_payload: soapResponse
      });

    return new Response(
      JSON.stringify({ success: true, message: 'NFS-e processada com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-nfse function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido no processamento' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
