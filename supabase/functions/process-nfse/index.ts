
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

    // Primeiro buscar a NFSe para obter o nfse_sp_settings_id
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select('nfse_sp_settings_id')
      .eq('id', nfseId)
      .single();

    if (nfseError || !nfse) {
      console.error("Error fetching NFSe:", nfseError)
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

    // Agora buscar as configurações específicas
    console.log("Fetching NFSe SP Settings...")
    const { data: settings, error: settingsError } = await supabaseClient
      .from('nfse_sp_settings')
      .select(`
        *,
        certificate:certificates_id (
          certificate_data,
          certificate_password
        )
      `)
      .eq('id', nfse.nfse_sp_settings_id)
      .single();

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

    // Agora buscar os dados completos da NFSe com todas as relações
    console.log("Fetching complete NFSe data...")
    const { data: completeNfse, error: completeNfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        client:client_id (*),
        settings:nfse_sp_settings_id (
          id,
          usuario_emissor,
          senha_emissor,
          ambiente,
          certificate:certificates_id (
            certificate_data,
            certificate_password
          )
        )
      `)
      .eq('id', nfseId)
      .single();

    if (completeNfseError || !completeNfse) {
      console.error("Error fetching complete NFSe data:", completeNfseError)
      return new Response(
        JSON.stringify({ 
          error: "Erro ao buscar dados completos da NFS-e",
          details: completeNfseError?.message 
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
      .single();

    if (companyError || !companyInfo) {
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

    // Validar campos obrigatórios
    console.log("Validating required fields...")
    const missingFields = [];
    
    // Validar prestador (company_info)
    if (!companyInfo.cnpj) missingFields.push('CNPJ do prestador');
    if (!companyInfo.inscricao_municipal) missingFields.push('Inscrição Municipal do prestador');
    if (!companyInfo.razao_social) missingFields.push('Razão Social do prestador');
    if (!companyInfo.endereco_logradouro) missingFields.push('Endereço do prestador');

    // Validar certificado
    if (!settings.certificate?.certificate_data) missingFields.push('Certificado Digital');
    if (!settings.certificate?.certificate_password) missingFields.push('Senha do Certificado');

    // Validar configurações
    if (!settings.usuario_emissor) missingFields.push('Usuário Emissor');
    if (!settings.senha_emissor) missingFields.push('Senha Emissor');

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

    // Adicionar à fila de transmissão
    console.log("Adding to transmission queue...")
    const { error: queueError } = await supabaseClient
      .from('sefaz_transmission_queue')
      .insert({
        documento_id: nfseId,
        tipo: 'nfse',
        status: 'pendente'
      });

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

    // Atualizar status da NFSe
    console.log("Updating NFSe status...")
    const { error: statusError } = await supabaseClient
      .from('nfse')
      .update({ status_sefaz: 'processando' })
      .eq('id', nfseId);

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
