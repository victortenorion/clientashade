
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as pkcs12 from "https://deno.land/x/pkcs12@v0.1.0/mod.ts";

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
        JSON.stringify({ 
          success: false, 
          message: 'Certificado e senha são obrigatórios' 
        }),
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
      // Remove o prefixo "data:application/x-pkcs12;base64," se existir
      const base64Certificate = certificado.includes('base64,') 
        ? certificado.split('base64,')[1] 
        : certificado;

      console.log("Recebido certificado de tamanho:", base64Certificate.length)
      
      // Decodifica o certificado base64
      const certificateBuffer = Uint8Array.from(atob(base64Certificate), c => c.charCodeAt(0))
      
      console.log("Tamanho do buffer do certificado:", certificateBuffer.length)

      // Tenta parsear o certificado PKCS#12
      const result = await pkcs12.parse(certificateBuffer, senha)
      
      if (!result) {
        throw new Error("Falha ao parsear o certificado")
      }

      console.log("Certificado parseado com sucesso")

      // Extrai informações do certificado
      const cert = result.cert
      
      if (!cert) {
        throw new Error("Certificado não encontrado no arquivo")
      }

      // Verifica a validade do certificado
      const notBefore = new Date(cert.notBefore)
      const notAfter = new Date(cert.notAfter)
      const now = new Date()

      if (now < notBefore || now > notAfter) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Certificado expirado ou ainda não válido' 
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        )
      }

      // Certificado válido
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Certificado válido',
          validade: notAfter.toISOString()
        }),
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
        JSON.stringify({ 
          success: false, 
          message: 'Certificado ou senha inválidos. Detalhes: ' + error.message 
        }),
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
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno: ' + error.message 
      }),
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
