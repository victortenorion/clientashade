import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
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

    // Gerar o XML do RPS
    const xmlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioRPS xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho Versao="1" xmlns="">
    <CPFCNPJRemetente>
      <CNPJ>${nfse.cnpj}</CNPJ>
    </CPFCNPJRemetente>
  </Cabecalho>
  <RPS xmlns="">
    <Assinatura>${/* TODO: Assinatura digital */}</Assinatura>
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

    // TODO: Implementar assinatura digital do XML
    // TODO: Implementar envio para o webservice da prefeitura

    // Atualizar status e salvar XML
    await supabaseClient
      .from('nfse')
      .update({
        xml_envio: xmlTemplate,
        status_sefaz: 'processando'
      })
      .eq('id', nfseId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'XML da NFS-e gerado com sucesso',
        xml: xmlTemplate
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

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
