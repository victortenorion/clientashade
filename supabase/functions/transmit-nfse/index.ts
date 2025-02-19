
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { NFSeSP } from './nfse-sp-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFSeSPTransmissionData {
  nfseId: string;
  loteId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurações do Supabase não encontradas')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { nfseId, loteId }: NFSeSPTransmissionData = await req.json()

    console.log('Iniciando transmissão:', { nfseId, loteId })

    // Buscar dados da NFS-e e configurações
    const { data: nfseData, error: nfseError } = await supabase
      .from('nfse')
      .select(`
        *,
        company_info (
          razao_social,
          cnpj,
          inscricao_municipal,
          endereco_logradouro,
          endereco_numero,
          endereco_complemento,
          endereco_bairro,
          endereco_cidade,
          endereco_uf,
          endereco_cep
        ),
        nfse_sp_settings!inner (
          usuario_emissor,
          senha_emissor,
          ambiente,
          certificates!inner (
            certificate_data,
            certificate_password
          )
        )
      `)
      .eq('id', nfseId)
      .single()

    if (nfseError) {
      throw nfseError
    }

    // Preparar cliente SOAP
    const nfseSP = new NFSeSP({
      ambiente: nfseData.nfse_sp_settings.ambiente,
      certificadoDigital: nfseData.nfse_sp_settings.certificates.certificate_data,
      senhaCertificado: nfseData.nfse_sp_settings.certificates.certificate_password,
      usuarioEmissor: nfseData.nfse_sp_settings.usuario_emissor,
      senhaEmissor: nfseData.nfse_sp_settings.senha_emissor
    })

    // Enviar lote RPS
    const resultado = await nfseSP.enviarLoteRps({
      cnpj: nfseData.company_info.cnpj,
      inscricaoMunicipal: nfseData.company_info.inscricao_municipal,
      loteRps: [{
        tipo: nfseData.tipo_rps,
        serie: nfseData.serie_rps,
        numero: nfseData.numero_rps,
        dataEmissao: nfseData.data_emissao,
        naturezaOperacao: nfseData.natureza_operacao,
        regimeEspecialTributacao: nfseData.regime_especial_tributacao,
        optanteSimplesNacional: nfseData.optante_simples === '1',
        incentivadorCultural: nfseData.incentivador_cultural,
        status: nfseData.status_rps,
        valorServicos: nfseData.valor_servicos,
        valorDeducoes: nfseData.valor_deducoes,
        valorPis: nfseData.valor_pis,
        valorCofins: nfseData.valor_cofins,
        valorInss: nfseData.valor_inss,
        valorIr: nfseData.valor_ir,
        valorCsll: nfseData.valor_csll,
        issRetido: nfseData.iss_retido === 'true',
        valorIss: nfseData.valor_iss,
        outrasRetencoes: nfseData.outras_retencoes,
        baseCalculo: nfseData.base_calculo,
        aliquota: nfseData.aliquota_servicos,
        valorLiquidoNfse: nfseData.valor_liquido,
        codigoServico: nfseData.codigo_servico,
        discriminacao: nfseData.discriminacao_servicos,
        codigoMunicipio: nfseData.codigo_municipio_prestacao
      }]
    })

    // Atualizar status da NFS-e
    const { error: updateError } = await supabase
      .from('nfse')
      .update({
        status_sefaz: resultado.success ? 'sucesso' : 'erro',
        protocolo: resultado.protocolo,
        mensagem_sefaz: resultado.mensagem
      })
      .eq('id', nfseId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify(resultado),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Erro na transmissão:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
