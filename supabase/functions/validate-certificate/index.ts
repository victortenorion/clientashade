
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
    
    console.log("Recebido certificado e senha");
    console.log("Senha recebida:", senha);
    
    if (!certificado || !senha) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Certificado e senha são obrigatórios' 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    try {
      // Decodifica o certificado base64 para um buffer
      const binaryString = atob(certificado);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log("Certificado decodificado, tentando parsear...");
      
      // Tenta parsear o certificado PKCS#12
      const result = await pkcs12.parse(bytes, senha);
      
      if (!result || !result.cert) {
        throw new Error("Certificado não encontrado no arquivo");
      }

      const cert = result.cert;
      const notBefore = new Date(cert.notBefore);
      const notAfter = new Date(cert.notAfter);
      const now = new Date();

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
        );
      }

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
      );
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Senha incorreta ou certificado inválido' 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
})
