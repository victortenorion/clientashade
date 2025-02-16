
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import forge from "npm:node-forge";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nfseId, motivoCancelamento } = await req.json();

    // Verificar se a NFS-e existe e pode ser cancelada
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        nfse_sp_settings (
          *,
          certificates (
            certificado,
            senha
          )
        )
      `)
      .eq('id', nfseId)
      .single();

    if (nfseError) throw new Error('NFS-e não encontrada');
    if (nfse.cancelada) throw new Error('NFS-e já está cancelada');
    if (nfse.status_sefaz !== 'autorizada') throw new Error('Apenas NFS-e autorizadas podem ser canceladas');

    // Preparar dados para o cancelamento
    const settings = nfse.nfse_sp_settings;
    if (!settings) throw new Error('Configurações da NFS-e SP não encontradas');

    const certificado = settings.certificates?.certificado;
    const senha = settings.certificates?.senha;
    
    if (!certificado || !senha) {
      throw new Error('Certificado digital não encontrado');
    }

    // Preparar XML de cancelamento
    const xmlCancelamento = `<?xml version="1.0" encoding="UTF-8"?>
<PedidoCancelamentoNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${settings.cnpj.replace(/\D/g, '')}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
  </Cabecalho>
  <Detalhe xmlns="">
    <ChaveNFe>
      <InscricaoPrestador>${settings.inscricao_municipal}</InscricaoPrestador>
      <NumeroNFe>${nfse.numero_nfse}</NumeroNFe>
    </ChaveNFe>
    <AssinaturaCancelamento>${await gerarAssinaturaCancelamento(
      settings.inscricao_municipal,
      nfse.numero_nfse
    )}</AssinaturaCancelamento>
  </Detalhe>
</PedidoCancelamentoNFe>`;

    // Assinar XML com certificado
    const xmlAssinado = await assinarXML(xmlCancelamento, certificado, senha);

    console.log('Enviando requisição de cancelamento para a Prefeitura...');
    
    // Enviar para a API da prefeitura
    const response = await fetch('https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/cancelamento',
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <CancelarNfseRequest xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>1</VersaoSchema>
      <MensagemXML>${xmlAssinado}</MensagemXML>
    </CancelarNfseRequest>
  </soap:Body>
</soap:Envelope>`
    });

    if (!response.ok) {
      throw new Error(`Erro na chamada à API da Prefeitura: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('Resposta da Prefeitura:', responseText);

    // Verificar resposta da prefeitura
    if (responseText.includes('<Sucesso>true</Sucesso>')) {
      // Atualizar status da NFS-e
      const { error: updateError } = await supabaseClient
        .from('nfse')
        .update({
          cancelada: true,
          data_cancelamento: new Date().toISOString(),
          motivo_cancelamento: motivoCancelamento
        })
        .eq('id', nfseId);

      if (updateError) throw updateError;

      // Registrar evento de cancelamento
      await supabaseClient
        .from('nfse_eventos')
        .insert({
          nfse_id: nfseId,
          tipo_evento: 'cancelamento',
          status: 'sucesso',
          descricao: motivoCancelamento,
          xml_envio: xmlAssinado,
          xml_retorno: responseText
        });

      return new Response(
        JSON.stringify({ success: true, message: 'NFS-e cancelada com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Erro no cancelamento da NFS-e: ' + extrairMensagemErro(responseText));
    }

  } catch (error) {
    console.error('Erro ao cancelar NFS-e:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Funções auxiliares
async function assinarXML(xml: string, certificadoBase64: string, senha: string): Promise<string> {
  // Decodificar o certificado
  const binaryString = atob(certificadoBase64);
  const der = forge.util.createBuffer(binaryString, 'binary');
  const asn1 = forge.asn1.fromDer(der);
  const pkcs12 = forge.pkcs12.pkcs12FromAsn1(asn1, senha);

  // Extrair chave privada e certificado
  const keyData = pkcs12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  const certBag = pkcs12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0];

  if (!keyData || !certBag) {
    throw new Error('Certificado digital inválido');
  }

  const privateKey = keyData.key;
  const cert = certBag.cert;

  // Criar assinatura digital
  const md = forge.md.sha1.create();
  md.update(xml, 'utf8');
  const signature = privateKey.sign(md);

  // Retornar XML assinado (implementação simplificada)
  return xml.replace('</PedidoCancelamentoNFe>', `<Signature>${forge.util.encode64(signature)}</Signature></PedidoCancelamentoNFe>`);
}

async function gerarAssinaturaCancelamento(inscricaoMunicipal: string, numeroNFe: number): Promise<string> {
  const texto = `${inscricaoMunicipal}${numeroNFe}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function extrairMensagemErro(xmlResponse: string): string {
  // Implementar parser de XML para extrair mensagem de erro
  // Por simplicidade, retornando mensagem genérica
  return xmlResponse.includes('<Erro>') 
    ? 'Erro reportado pela Prefeitura'
    : 'Erro desconhecido no processamento';
}
