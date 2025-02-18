
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Starting process-nfse function")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { nfseId } = await req.json()
    console.log(`Processing NFSe ID: ${nfseId}`)

    if (!nfseId) {
      console.error("Missing NFSe ID")
      return new Response(
        JSON.stringify({ error: "ID da NFS-e é obrigatório" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // First, get the NFSe basic data to verify it exists
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        nfse_sp_settings:nfse_sp_settings_id (
          id,
          usuario_emissor,
          senha_emissor,
          ambiente,
          certificates:certificates_id (
            certificate_data,
            certificate_password
          )
        )
      `)
      .eq('id', nfseId)
      .single()

    if (nfseError || !nfse) {
      console.error("Error fetching basic NFSe data:", nfseError)
      return new Response(
        JSON.stringify({ 
          error: "NFS-e não encontrada",
          details: nfseError?.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get company info (single record table)
    const { data: companyInfo, error: companyError } = await supabaseClient
      .from('company_info')
      .select('*')
      .limit(1)
      .single()

    if (companyError) {
      console.error("Error fetching company info:", companyError)
      return new Response(
        JSON.stringify({ 
          error: "Informações da empresa não encontradas",
          details: companyError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Validate required settings
    const missingFields = []
    
    if (!nfse.nfse_sp_settings?.usuario_emissor) missingFields.push('usuario_emissor')
    if (!nfse.nfse_sp_settings?.senha_emissor) missingFields.push('senha_emissor')
    if (!nfse.nfse_sp_settings?.certificates?.certificate_data) missingFields.push('certificado_digital')
    if (!nfse.nfse_sp_settings?.certificates?.certificate_password) missingFields.push('senha_certificado')
    if (!companyInfo?.cnpj) missingFields.push('cnpj')
    if (!companyInfo?.inscricao_municipal) missingFields.push('inscricao_municipal')

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields)
      return new Response(
        JSON.stringify({ 
          error: `Campos obrigatórios não configurados: ${missingFields.join(', ')}`,
          missingFields 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Add to transmission queue
    const { error: queueError } = await supabaseClient
      .from('sefaz_transmission_queue')
      .insert({
        documento_id: nfseId,
        tipo: 'nfse',
        status: 'pendente'
      })

    if (queueError) {
      console.error("Error adding to transmission queue:", queueError)
      return new Response(
        JSON.stringify({ 
          error: "Erro ao adicionar à fila de transmissão",
          details: queueError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Update NFSe status
    const { error: statusError } = await supabaseClient
      .from('nfse')
      .update({
        status_sefaz: 'processando'
      })
      .eq('id', nfseId)

    if (statusError) {
      console.error("Error updating NFSe status:", statusError)
      return new Response(
        JSON.stringify({ 
          error: "Erro ao atualizar status da NFS-e",
          details: statusError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log(`Successfully queued NFSe ID: ${nfseId} for processing`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "NFS-e enviada para processamento" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(
      JSON.stringify({ 
        error: "Erro interno ao processar NFS-e",
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
