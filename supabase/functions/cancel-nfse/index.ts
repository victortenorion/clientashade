
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
    const { nfseId, motivoCancelamento } = await req.json()

    // Buscar dados da NFS-e
    const { data: nfse, error: nfseError } = await supabase
      .from('nfse')
      .select(`
        *,
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

    if (nfseError) throw nfseError

    // Registrar evento de cancelamento
    const { error: eventoError } = await supabase
      .from('nfse_eventos')
      .insert({
        nfse_id: nfseId,
        tipo_evento: 'cancelamento',
        descricao: motivoCancelamento,
        status: 'processando'
      })

    if (eventoError) throw eventoError

    // Atualizar status da NFS-e
    const { error: updateError } = await supabase
      .from('nfse')
      .update({
        cancelada: true,
        data_cancelamento: new Date().toISOString(),
        motivo_cancelamento: motivoCancelamento,
        status_sefaz: 'cancelada'
      })
      .eq('id', nfseId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true }),
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
