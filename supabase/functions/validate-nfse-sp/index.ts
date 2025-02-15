
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface NFSeSPSettings {
  inscricao_municipal: string;
  codigo_regime_tributario: string;
  tipo_documento: string;
  versao_schema: string;
  servico_operacao: string;
  servico_exigibilidade: string;
}

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obter as configurações da NFS-e SP
    const { data: settings, error: settingsError } = await supabaseClient
      .from('nfse_sp_settings')
      .select('*')
      .single()

    if (settingsError) {
      throw new Error('Erro ao obter configurações: ' + settingsError.message)
    }

    // Verificar campos obrigatórios
    const requiredFields = [
      'inscricao_municipal',
      'codigo_regime_tributario',
      'tipo_documento',
      'versao_schema',
      'servico_operacao',
      'servico_exigibilidade'
    ]

    const missingFields = requiredFields.filter(field => !settings[field])

    if (missingFields.length > 0) {
      await supabaseClient
        .from('nfse_sp_settings')
        .update({
          config_status: 'incompleto',
          ultima_verificacao: new Date().toISOString(),
          mensagem_verificacao: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
        })
        .eq('id', settings.id)

      return new Response(
        JSON.stringify({
          success: false,
          message: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validar formato da inscrição municipal (apenas números)
    if (settings.inscricao_municipal && !/^\d+$/.test(settings.inscricao_municipal)) {
      await supabaseClient
        .from('nfse_sp_settings')
        .update({
          config_status: 'erro',
          ultima_verificacao: new Date().toISOString(),
          mensagem_verificacao: 'Inscrição Municipal deve conter apenas números'
        })
        .eq('id', settings.id)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Inscrição Municipal deve conter apenas números'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Se chegou até aqui, está tudo ok
    await supabaseClient
      .from('nfse_sp_settings')
      .update({
        config_status: 'valido',
        ultima_verificacao: new Date().toISOString(),
        mensagem_verificacao: 'Configurações válidas'
      })
      .eq('id', settings.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Configurações válidas'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
})
