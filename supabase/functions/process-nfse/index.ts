
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { formData, companyData, sefazData } = await req.json()

    console.log('Dados recebidos:', { formData, companyData, sefazData })

    // Validar dados obrigatórios
    if (!formData.codigo_servico) {
      throw new Error('Código do serviço é obrigatório')
    }

    if (!formData.discriminacao_servicos) {
      throw new Error('Discriminação dos serviços é obrigatória')
    }

    // Criar o lote de RPS
    const { data: lote, error: loteError } = await supabase
      .from('nfse_sp_lotes')
      .insert({
        cnpj: companyData.cnpj,
        inscricao_municipal: companyData.inscricao_municipal,
        quantidade_rps: 1,
        lista_rps: [{
          tipo: 'RPS',
          serie: '1',
          numero: formData.numero_rps,
          data_emissao: new Date().toISOString(),
          situacao: 'N'
        }],
        transacao: true,
        valor_total_servicos: 0, // Será atualizado posteriormente
        status: 'pendente'
      })
      .select()
      .single()

    if (loteError) {
      throw loteError
    }

    // Criar a NFS-e
    const { data: nfse, error: nfseError } = await supabase
      .from('nfse')
      .insert({
        codigo_servico: formData.codigo_servico,
        discriminacao_servicos: formData.discriminacao_servicos,
        natureza_operacao: formData.natureza_operacao,
        tipo_recolhimento: formData.tipo_recolhimento,
        numero_rps: formData.numero_rps,
        serie_rps: '1',
        tipo_rps: 'RPS',
        status_sefaz: 'pendente',
        ambiente: sefazData.ambiente
      })
      .select()
      .single()

    if (nfseError) {
      throw nfseError
    }

    // Adicionar à fila de transmissão
    const { error: queueError } = await supabase
      .from('sefaz_transmission_queue')
      .insert({
        tipo: 'nfse',
        documento_id: nfse.id,
        status: 'pendente'
      })

    if (queueError) {
      throw queueError
    }

    return new Response(
      JSON.stringify({ success: true, lote_id: lote.id, nfse_id: nfse.id }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
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
