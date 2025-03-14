
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Local Postgres connection
    const supabaseUrl = "http://localhost:54321";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5OX0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configurações
    const { data: settings } = await supabase
      .from('nfse_sp_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!settings) {
      throw new Error('Configurações não encontradas')
    }

    // Aqui você implementaria a lógica de consulta à API da prefeitura
    // usando as credenciais em settings.usuario_emissor e settings.senha_emissor
    // Por enquanto, vamos apenas simular um retorno
    const ultimoNumero = "0" // Substitua pela chamada real à API

    return new Response(
      JSON.stringify({ ultimoNumero }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
