
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

    // First get NFSe SP Settings
    console.log("Fetching NFSe SP Settings...")
    const { data: settings, error: settingsError } = await supabaseClient
      .from('nfse_sp_settings')
      .select(`
        *,
        certificates (
          certificate_data,
          certificate_password
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (settingsError || !settings) {
      console.error("Error fetching NFSe SP Settings:", settingsError)
      return new Response(
        JSON.stringify({ 
          error: "Configurações da NFS-e não encontradas. Configure primeiro as credenciais da Prefeitura e o certificado digital.",
          details: settingsError?.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Update NFSe with settings id if not set
    console.log("Updating NFSe with settings ID...")
    const { error: updateError } = await supabaseClient
      .from('nfse')
      .update({ nfse_sp_settings_id: settings.id })
      .eq('id', nfseId)

    if (updateError) {
      console.error("Error updating NFSe with settings ID:", updateError)
      return new Response(
        JSON.stringify({ 
          error: "Erro ao vincular configurações à NFS-e",
          details: updateError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Now get NFSe with all related data
    console.log("Fetching NFSe data...")
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        client:client_id (*),
        nfse_sp_settings:nfse_sp_settings_id (
          id,
          usuario_emissor,
          senha_emissor,
          ambiente,
          certificates (
            certificate_data,
            certificate_password
          )
        )
      `)
      .eq('id', nfseId)
      .single()

    if (nfseError || !nfse) {
      console.error("Error fetching NFSe data:", nfseError)
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

    // Get company info (prestador)
    console.log("Fetching company info...")
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

    // Validate all required settings
    console.log("Validating required fields...")
    const missingFields = []
    
    // Validate prestador (company_info)
    if (!companyInfo?.cnpj) missingFields.push('cnpj do prestador')
    if (!companyInfo?.inscricao_municipal) missingFields.push('inscricao_municipal do prestador')
    if (!companyInfo?.razao_social) missingFields.push('razao_social do prestador')
    if (!companyInfo?.endereco_logradouro) missingFields.push('endereço do prestador')
    if (!companyInfo?.endereco_numero) missingFields.push('número do endereço do prestador')
    if (!companyInfo?.endereco_bairro) missingFields.push('bairro do prestador')
    if (!companyInfo?.endereco_cidade) missingFields.push('cidade do prestador')
    if (!companyInfo?.endereco_uf) missingFields.push('UF do prestador')
    if (!companyInfo?.endereco_cep) missingFields.push('CEP do prestador')

    // Validate tomador (client)
    if (!nfse.client?.document) missingFields.push('documento do tomador')
    if (!nfse.client?.name) missingFields.push('nome do tomador')
    if (!nfse.client?.street) missingFields.push('endereço do tomador')
    if (!nfse.client?.street_number) missingFields.push('número do endereço do tomador')
    if (!nfse.client?.neighborhood) missingFields.push('bairro do tomador')
    if (!nfse.client?.city) missingFields.push('cidade do tomador')
    if (!nfse.client?.state) missingFields.push('UF do tomador')
    if (!nfse.client?.zip_code) missingFields.push('CEP do tomador')

    // Validate NFSe settings
    if (!settings.usuario_emissor) missingFields.push('usuario_emissor')
    if (!settings.senha_emissor) missingFields.push('senha_emissor')
    if (!settings.certificates?.[0]?.certificate_data) missingFields.push('certificado_digital')
    if (!settings.certificates?.[0]?.certificate_password) missingFields.push('senha_certificado')

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

    // Log data for debugging
    console.log("All validations passed, logging data...")
    console.log("Settings:", {
      usuario_emissor: settings.usuario_emissor,
      ambiente: settings.ambiente,
      certificado: settings.certificates?.[0]?.certificate_data ? "Present" : "Missing"
    })

    console.log("Prestador data:", {
      cnpj: companyInfo.cnpj,
      inscricao_municipal: companyInfo.inscricao_municipal,
      razao_social: companyInfo.razao_social,
      endereco: {
        logradouro: companyInfo.endereco_logradouro,
        numero: companyInfo.endereco_numero,
        bairro: companyInfo.endereco_bairro,
        cidade: companyInfo.endereco_cidade,
        uf: companyInfo.endereco_uf,
        cep: companyInfo.endereco_cep
      }
    })

    console.log("Tomador data:", {
      documento: nfse.client.document,
      nome: nfse.client.name,
      endereco: {
        logradouro: nfse.client.street,
        numero: nfse.client.street_number,
        bairro: nfse.client.neighborhood,
        cidade: nfse.client.city,
        uf: nfse.client.state,
        cep: nfse.client.zip_code
      }
    })

    // Add to transmission queue
    console.log("Adding to transmission queue...")
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
    console.log("Updating NFSe status...")
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
