
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
      console.log("Recebido certificado de tamanho:", certificado.length)
      
      // Decodifica o certificado base64 para um buffer
      let certificateBuffer;
      try {
        certificateBuffer = Uint8Array.from(atob(certificado), c => c.charCodeAt(0));
        console.log("Certificado decodificado com sucesso, tamanho:", certificateBuffer.length);
      } catch (decodeError) {
        console.error("Erro ao decodificar certificado:", decodeError);
        throw new Error("Erro ao decodificar o certificado. Verifique se o arquivo é válido.");
      }
      
      // Tenta parsear o certificado PKCS#12
      let result;
      try {
        result = await pkcs12.parse(certificateBuffer, senha);
        console.log("Certificado parseado com sucesso");
      } catch (parseError) {
        console.error("Erro ao parsear certificado:", parseError);
        throw new Error("Senha incorreta ou certificado inválido");
      }
      
      if (!result || !result.cert) {
        throw new Error("Certificado não encontrado no arquivo");
      }

      // Verifica informações específicas para NFS-e SP
      const cert = result.cert;
      
      // Verifica se é um certificado tipo A1
      if (cert.keyUsage && !cert.keyUsage.includes('digitalSignature')) {
        throw new Error("O certificado deve ser do tipo A1 com permissão para assinatura digital");
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
          message: error.message || 'Erro ao validar certificado'
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
