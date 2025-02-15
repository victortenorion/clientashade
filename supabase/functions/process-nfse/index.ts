import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Request-Headers': '*'
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

      // Atualizar status de transmissão para 'enviando'
      const { error: updateError } = await supabaseClient
        .from('nfse')
        .update({ 
          status_transmissao: 'enviando',
          status_sefaz: 'processando'
        })
        .eq('id', nfseId)

      if (updateError) {
        console.error("Erro ao atualizar status:", updateError)
        throw updateError
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
        throw new Error('Certificado digital não encontrado. Faça o upload do certificado.')
      }

      console.log("Certificado digital encontrado e válido")

      // Buscar e validar configurações do certificado
      console.log("Buscando configurações do certificado...")
      const { data: configs, error: configsError } = await supabaseClient
        .from('nfse_config')
        .select('*')

      if (configsError) {
        console.error("Erro ao buscar configurações do certificado:", configsError)
        throw new Error('Erro ao buscar configurações do certificado: ' + configsError.message)
      }

      console.log("Configurações encontradas:", configs?.length || 0)
      
      const nfseConfig = configs?.[0]

      if (!nfseConfig) {
        console.error("Nenhuma configuração encontrada")
        throw new Error('Configurações da NFS-e não encontradas. Configure o certificado digital primeiro.')
      }

      // Validar certificado
      try {
        console.log("Validando certificado digital...")
        const certBuffer = Buffer.from(certificate.certificate_data, 'base64')
        if (!certBuffer || certBuffer.length === 0) {
          throw new Error('Certificado digital inválido ou vazio')
        }
        console.log("Tamanho do certificado:", certBuffer.length, "bytes")
      } catch (certError) {
        console.error("Erro na validação do certificado:", certError)
        throw new Error('Erro ao validar certificado digital: ' + certError.message)
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
            zip_code
          )
        `)
        .eq('id', nfseId)
        .maybeSingle()

      if (nfseError) {
        console.error("Erro ao buscar NFS-e:", nfseError)
        throw nfseError
      }
      if (!nfse) throw new Error('NFS-e não encontrada')

      // Buscar configurações da NFS-e SP
      console.log("Buscando configurações da NFS-e SP...")
      const { data: spSettings, error: spError } = await supabaseClient
        .from('nfse_sp_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (spError) {
        console.error("Erro ao buscar configurações SP:", spError)
        throw spError
      }

      if (!spSettings) {
        console.log("Criando configurações padrão da NFS-e SP...")
        const { data: newSettings, error: newSettingsError } = await supabaseClient
          .from('nfse_sp_settings')
          .insert({
            versao_schema: '2.00',
            rps_status: 'N',
            servico_operacao: '1',
            servico_exigibilidade: '1',
            tipo_documento: 'CNPJ'
          })
          .select()
          .single()

        if (newSettingsError) throw newSettingsError
        if (!newSettings) throw new Error('Erro ao criar configurações padrão da NFS-e SP')
      }

      // Registrar evento de início do processamento
      console.log("Registrando evento de processamento...")
      const { error: eventError } = await supabaseClient
        .from('nfse_eventos')
        .insert({
          nfse_id: nfseId,
          tipo_evento: 'processamento',
          descricao: 'Iniciando processamento da NFS-e',
          status: 'processando'
        })

      if (eventError) throw eventError

      // Atualizar status da NFS-e
      console.log("Atualizando status da NFS-e...")
      const { error: updateError } = await supabaseClient
        .from('nfse')
        .update({ status_sefaz: 'processando' })
        .eq('id', nfseId)

      if (updateError) throw updateError

      // Montar XML de envio
      console.log("Montando XML de envio...")
      const xmlEnvio = `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioLoteRPS xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="${spSettings?.versao_schema || '2.00'}">
    <CPFCNPJRemetente>
      <CNPJ>${nfse.clients.document.replace(/\D/g, '')}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
    <dtInicio>${nfse.data_competencia}</dtInicio>
    <dtFim>${nfse.data_competencia}</dtFim>
    <QtdRPS>1</QtdRPS>
    <ValorTotalServicos>${nfse.valor_servicos}</ValorTotalServicos>
    <ValorTotalDeducoes>${nfse.deducoes}</ValorTotalDeducoes>
  </Cabecalho>
  <RPS xmlns="">
    <Assinatura></Assinatura>
    <ChaveRPS>
      <InscricaoPrestador>${nfseConfig.inscricao_municipal}</InscricaoPrestador>
      <SerieRPS>${nfse.serie_rps || '1'}</SerieRPS>
      <NumeroRPS>${nfse.numero_rps}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>RPS</TipoRPS>
    <DataEmissao>${nfse.data_emissao}</DataEmissao>
    <StatusRPS>N</StatusRPS>
    <TributacaoRPS>T</TributacaoRPS>
    <ValorServicos>${nfse.valor_servicos}</ValorServicos>
    <ValorDeducoes>${nfse.deducoes}</ValorDeducoes>
    <ValorPIS>${nfse.valor_pis || 0}</ValorPIS>
    <ValorCOFINS>${nfse.valor_cofins || 0}</ValorCOFINS>
    <ValorINSS>${nfse.valor_inss || 0}</ValorINSS>
    <ValorIR>${nfse.valor_ir || 0}</ValorIR>
    <ValorCSLL>${nfse.valor_csll || 0}</ValorCSLL>
    <CodigoServico>${nfse.codigo_servico}</CodigoServico>
    <AliquotaServicos>${nfse.aliquota_iss || 0}</AliquotaServicos>
    <ISSRetido>${nfse.retencao_iss ? 'true' : 'false'}</ISSRetido>
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
      <CEP>${nfse.clients.zip_code?.replace(/\D/g, '')}</CEP>
    </EnderecoTomador>
    <EmailTomador>${nfse.clients.email || ''}</EmailTomador>
    <Discriminacao>${nfse.discriminacao_servicos}</Discriminacao>
  </RPS>
</PedidoEnvioLoteRPS>`

      // Salvar XML de envio
      console.log("Salvando XML de envio...")
      const { error: xmlError } = await supabaseClient
        .from('nfse')
        .update({ 
          xml_envio: xmlEnvio,
          status_sefaz: 'enviando'
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
          status: 'pendente'
        })

      if (queueError) throw queueError

      // Após o processamento bem-sucedido
      const { error: finalUpdateError } = await supabaseClient
        .from('nfse')
        .update({ 
          status_transmissao: 'enviado',
          status_sefaz: 'processado'
        })
        .eq('id', nfseId)

      if (finalUpdateError) throw finalUpdateError

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
