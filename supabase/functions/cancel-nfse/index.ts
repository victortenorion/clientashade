
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Starting cancel-nfse function")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request data
    const { nfseId, motivoCancelamento } = await req.json()
    console.log(`Attempting to cancel NFSe ID: ${nfseId} with reason: ${motivoCancelamento}`)

    if (!nfseId || !motivoCancelamento) {
      console.error("Missing required parameters")
      return new Response(
        JSON.stringify({ error: "ID da NFS-e e motivo do cancelamento são obrigatórios" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // First, let's check if the NFSe exists and get its details
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        id,
        numero_nfse,
        status_sefaz,
        cancelada,
        nfse_sp_settings_id
      `)
      .eq('id', nfseId)
      .single()

    if (nfseError || !nfse) {
      console.error("Error fetching NFSe:", nfseError)
      return new Response(
        JSON.stringify({ error: "NFS-e não encontrada" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (nfse.cancelada) {
      console.error("NFSe already cancelled")
      return new Response(
        JSON.stringify({ error: "NFS-e já está cancelada" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (nfse.status_sefaz !== 'autorizada') {
      console.error("NFSe not in authorized status")
      return new Response(
        JSON.stringify({ error: "Apenas NFS-e autorizadas podem ser canceladas" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get NFSe SP settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('nfse_sp_settings')
      .select('*')
      .eq('id', nfse.nfse_sp_settings_id)
      .single()

    if (settingsError || !settings) {
      console.error("Error fetching NFSe SP settings:", settingsError)
      return new Response(
        JSON.stringify({ error: "Configurações da NFS-e não encontradas" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Add to transmission queue with correct tipo value
    const { error: queueError } = await supabaseClient
      .from('sefaz_transmission_queue')
      .insert({
        documento_id: nfseId,
        tipo: 'nfse',  // Alterado de 'cancelamento' para 'nfse'
        status: 'pendente'
      })

    if (queueError) {
      console.error("Error adding to transmission queue:", queueError)
      return new Response(
        JSON.stringify({ error: "Erro ao adicionar à fila de transmissão" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Update NFSe status
    const { error: updateError } = await supabaseClient
      .from('nfse')
      .update({
        cancelada: true,
        data_cancelamento: new Date().toISOString(),
        motivo_cancelamento: motivoCancelamento,
        status_sefaz: 'processando'
      })
      .eq('id', nfseId)

    if (updateError) {
      console.error("Error updating NFSe:", updateError)
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar status da NFS-e" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Add event log
    const { error: eventError } = await supabaseClient
      .from('nfse_eventos')
      .insert({
        nfse_id: nfseId,
        tipo_evento: 'cancelamento',
        descricao: motivoCancelamento,
        status: 'processando'
      })

    if (eventError) {
      console.error("Error creating event log:", eventError)
      // Don't return error here as the cancellation was already processed
    }

    console.log(`Successfully initiated cancellation for NFSe ID: ${nfseId}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Solicitação de cancelamento enviada com sucesso" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar cancelamento" }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
