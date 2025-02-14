
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { certificado, senha } = await req.json()
    
    if (!certificado || !senha) {
      return new Response(
        JSON.stringify({ error: 'Certificado e senha são obrigatórios' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    try {
      // Decodifica o certificado base64
      const certificateBuffer = Uint8Array.from(atob(certificado.split(',')[1]), c => c.charCodeAt(0))
      
      // Tenta importar o certificado PKCS#12
      const pkcs12 = await crypto.subtle.importPkcs12(
        certificateBuffer,
        senha,
        ["sign"]
      );

      return new Response(
        JSON.stringify({ valid: true, message: 'Certificado válido' }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      return new Response(
        JSON.stringify({ valid: false, message: 'Certificado ou senha inválidos' }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }
})
