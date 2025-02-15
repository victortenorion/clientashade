
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Request-Headers': '*'
}

function formatDate(date: string) {
  return date.split('T')[0].replace(/-/g, '');
}

function cleanDocument(doc: string) {
  return doc.replace(/\D/g, '');
}

console.log("Função de processamento de NFS-e iniciada")

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  if (req.method === 'POST') {
    try {
      const { nfseId } = await req.json()
      console.log("ID da NFS-e recebido:", nfseId)

      if (!nfseId) {
        throw new Error('ID da NFS-e não informado')
      }

      // Criar cliente Supabase
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      console.log("Cliente Supabase criado, atualizando status...")

      // Atualizar status inicial para 'processando'
      const { error: statusError } = await supabaseClient
        .from('nfse')
        .update({ 
          status_transmissao: 'processando',
          status_sefaz: 'processando'
        })
        .eq('id', nfseId)

      if (statusError) {
        console.error("Erro ao atualizar status:", statusError)
        throw statusError
      }

      // Primeiro, buscar o certificado válido mais recente
      console.log("Buscando certificado digital...")
      const { data: certificate, error: certError } = await supabaseClient
        .from('certificates')
        .select('*')
        .eq('type', 'nfse')
        .eq('is_valid', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (certError) {
        console.error("Erro ao buscar certificado:", certError)
        throw new Error('Erro ao buscar certificado: ' + certError.message)
      }

      if (!certificate || !certificate.certificate_data) {
        console.error("Nenhum certificado válido encontrado")
        throw new Error('Certificado digital não encontrado ou inválido')
      }

      // Buscar configurações da NFS-e SP
      console.log("Buscando configurações da NFS-e SP...")
      const { data: spSettings, error: spError } = await supabaseClient
        .from('nfse_sp_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (spError) {
        console.error("Erro ao buscar configurações SP:", spError)
        throw spError
      }

      if (!spSettings) {
        throw new Error('Configurações da NFS-e SP não encontradas')
      }

      // Buscar configurações da empresa
      console.log("Buscando configurações da empresa...")
      const { data: companyInfo, error: companyError } = await supabaseClient
        .from('company_info')
        .select('*')
        .single()

      if (companyError) {
        console.error("Erro ao buscar configurações da empresa:", companyError)
        throw companyError
      }

      if (!companyInfo) {
        throw new Error('Configurações da empresa não encontradas')
      }

      // Buscar dados da NFS-e
      console.log("Buscando dados da NFS-e...")
      const { data: nfse, error: nfseError } = await supabaseClient
        .from('nfse')
        .select(`
          *,
          clients (
            name,
            document,
            email,
            street,
            street_number,
            complement,
            neighborhood,
            city,
            state,
            zip_code,
            person_type
          )
        `)
        .eq('id', nfseId)
        .maybeSingle()

      if (nfseError) {
        console.error("Erro ao buscar NFS-e:", nfseError)
        throw nfseError
      }
      if (!nfse) throw new Error('NFS-e não encontrada')

      // Verificar campos obrigatórios
      if (!nfse.clients.document) throw new Error('Documento do cliente não informado')
      if (!nfse.clients.zip_code) throw new Error('CEP do cliente não informado')
      if (!companyInfo.inscricao_municipal) throw new Error('Inscrição Municipal não configurada')
      if (!nfse.valor_servicos) throw new Error('Valor dos serviços não informado')
      if (!nfse.codigo_servico) throw new Error('Código do serviço não informado')

      // Montar XML de envio
      console.log("Montando XML de envio...")
      const inscricaoMunicipal = companyInfo.inscricao_municipal.padStart(8, '0');
      const xmlEnvio = `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioLoteRPS xmlns="http://www.prefeitura.sp.gov.br/nfe" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Cabecalho xmlns="" Versao="${spSettings.versao_schema || '2.00'}">
    <CPFCNPJRemetente>
      <CNPJ>${cleanDocument(companyInfo.cnpj)}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
    <dtInicio>${formatDate(nfse.data_competencia)}</dtInicio>
    <dtFim>${formatDate(nfse.data_competencia)}</dtFim>
    <QtdRPS>1</QtdRPS>
    <ValorTotalServicos>${nfse.valor_servicos.toFixed(2)}</ValorTotalServicos>
    <ValorTotalDeducoes>${(nfse.deducoes || 0).toFixed(2)}</ValorTotalDeducoes>
  </Cabecalho>
  <RPS xmlns="">
    <Assinatura>${inscricaoMunicipal}${nfse.serie_rps || '1'}${nfse.numero_rps.padStart(12, '0')}${formatDate(nfse.data_emissao)}${(nfse.valor_servicos || 0).toFixed(2).replace('.', '')}${(nfse.deducoes || 0).toFixed(2).replace('.', '')}${cleanDocument(nfse.clients.document)}</Assinatura>
    <ChaveRPS>
      <InscricaoPrestador>${inscricaoMunicipal}</InscricaoPrestador>
      <SerieRPS>${nfse.serie_rps || '1'}</SerieRPS>
      <NumeroRPS>${nfse.numero_rps}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>RPS</TipoRPS>
    <DataEmissao>${formatDate(nfse.data_emissao)}</DataEmissao>
    <StatusRPS>${spSettings.rps_status || 'N'}</StatusRPS>
    <TributacaoRPS>${nfse.tributacao_rps || 'T'}</TributacaoRPS>
    <ValorServicos>${nfse.valor_servicos.toFixed(2)}</ValorServicos>
    <ValorDeducoes>${(nfse.deducoes || 0).toFixed(2)}</ValorDeducoes>
    <ValorPIS>${(nfse.valor_pis || 0).toFixed(2)}</ValorPIS>
    <ValorCOFINS>${(nfse.valor_cofins || 0).toFixed(2)}</ValorCOFINS>
    <ValorINSS>${(nfse.valor_inss || 0).toFixed(2)}</ValorINSS>
    <ValorIR>${(nfse.valor_ir || 0).toFixed(2)}</ValorIR>
    <ValorCSLL>${(nfse.valor_csll || 0).toFixed(2)}</ValorCSLL>
    <CodigoServico>${nfse.codigo_servico.padStart(5, '0')}</CodigoServico>
    <AliquotaServicos>${(nfse.aliquota_iss || 0).toFixed(4)}</AliquotaServicos>
    <ISSRetido>${nfse.retencao_iss ? 'true' : 'false'}</ISSRetido>
    ${nfse.clients.person_type === 'legal' ? `
    <CPFCNPJTomador>
      <CNPJ>${cleanDocument(nfse.clients.document)}</CNPJ>
    </CPFCNPJTomador>` : `
    <CPFCNPJTomador>
      <CPF>${cleanDocument(nfse.clients.document)}</CPF>
    </CPFCNPJTomador>`}
    <RazaoSocialTomador>${nfse.clients.name}</RazaoSocialTomador>
    <EnderecoTomador>
      <TipoLogradouro>Rua</TipoLogradouro>
      <Logradouro>${nfse.clients.street}</Logradouro>
      <NumeroEndereco>${nfse.clients.street_number}</NumeroEndereco>
      <ComplementoEndereco>${nfse.clients.complement || ''}</ComplementoEndereco>
      <Bairro>${nfse.clients.neighborhood}</Bairro>
      <Cidade>${nfse.clients.city}</Cidade>
      <UF>${nfse.clients.state}</UF>
      <CEP>${cleanDocument(nfse.clients.zip_code)}</CEP>
    </EnderecoTomador>
    ${nfse.clients.email ? `<EmailTomador>${nfse.clients.email}</EmailTomador>` : ''}
    <Discriminacao>${nfse.discriminacao_servicos}</Discriminacao>
  </RPS>
</PedidoEnvioLoteRPS>`

      // Salvar XML de envio e manter status como 'processando'
      console.log("Salvando XML de envio...")
      const { error: xmlError } = await supabaseClient
        .from('nfse')
        .update({ 
          xml_envio: xmlEnvio,
          status_sefaz: 'processando'
        })
        .eq('id', nfseId)

      if (xmlError) throw xmlError

      // Registrar na fila de transmissão
      console.log("Registrando na fila de transmissão...")
      const { error: queueError } = await supabaseClient
        .from('sefaz_transmission_queue')
        .insert({
          tipo: 'nfse',
          documento_id: nfseId,
          status: 'processando'
        })

      if (queueError) throw queueError

      // Manter status como 'processando' após registrar na fila
      const { error: finalError } = await supabaseClient
        .from('nfse')
        .update({ 
          status_transmissao: 'processando',
          status_sefaz: 'processando'
        })
        .eq('id', nfseId)

      if (finalError) throw finalError

      console.log("Processamento concluído com sucesso")
      return new Response(
        JSON.stringify({
          success: true,
          message: 'NFS-e enviada para processamento'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error) {
      console.error('Erro ao processar NFS-e:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Método não permitido'
    }),
    {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  )
})
