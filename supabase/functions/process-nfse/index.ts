
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
    const { data: nfseBasic, error: nfseBasicError } = await supabaseClient
      .from('nfse')
      .select('id, numero_nfse')
      .eq('id', nfseId)
      .single()

    if (nfseBasicError || !nfseBasic) {
      console.error("Error fetching basic NFSe data:", nfseBasicError)
      return new Response(
        JSON.stringify({ 
          error: "NFS-e não encontrada",
          details: nfseBasicError?.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get NFSe settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('nfse_sp_settings')
      .select(`
        id,
        usuario_emissor,
        senha_emissor,
        ambiente,
        certificates:certificates_id (
          certificate_data,
          certificate_password
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (settingsError) {
      console.error("Error fetching NFSe SP settings:", settingsError)
      return new Response(
        JSON.stringify({ 
          error: "Configurações da NFS-e não encontradas",
          details: settingsError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get company info
    const { data: companyInfo, error: companyError } = await supabaseClient
      .from('company_info')
      .select('cnpj, inscricao_municipal')
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
    
    if (!settings?.usuario_emissor) missingFields.push('usuario_emissor')
    if (!settings?.senha_emissor) missingFields.push('senha_emissor')
    if (!settings?.certificates?.certificate_data) missingFields.push('certificado_digital')
    if (!settings?.certificates?.certificate_password) missingFields.push('senha_certificado')
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

    // Update NFSe with settings
    const { error: updateError } = await supabaseClient
      .from('nfse')
      .update({
        nfse_sp_settings_id: settings.id
      })
      .eq('id', nfseId)

    if (updateError) {
      console.error("Error updating NFSe with settings:", updateError)
      return new Response(
        JSON.stringify({ 
          error: "Erro ao atualizar configurações da NFS-e",
          details: updateError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
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
