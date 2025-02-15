
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
    
    console.log("Iniciando processo de validação do certificado");
    console.log("Senha recebida:", senha);
    
    if (!certificado || !senha) {
      console.log("Certificado ou senha não fornecidos");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Certificado e senha são obrigatórios' 
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    try {
      // Remove possíveis caracteres inválidos do base64
      const base64Clean = certificado.replace(/[\r\n\s]+/g, '');
      console.log("Tamanho do certificado limpo:", base64Clean.length);

      // Converte base64 para array de bytes
      let certificateBytes;
      try {
        // Primeiro, converte base64 para string binária
        const binaryString = atob(base64Clean);
        console.log("Certificado decodificado de base64");
        
        // Converte string binária para Uint8Array
        certificateBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          certificateBytes[i] = binaryString.charCodeAt(i);
        }
        console.log("Array de bytes criado, tamanho:", certificateBytes.length);
      } catch (e) {
        console.error("Erro na conversão do certificado:", e);
        throw new Error("Formato do certificado inválido. Certifique-se de que é um arquivo .pfx válido.");
      }

      console.log("Tentando parsear o certificado PKCS#12...");
      
      // Tenta parsear o certificado com a senha fornecida
      const result = await pkcs12.parse(certificateBytes, senha);
      console.log("Certificado parseado com sucesso");

      if (!result || !result.cert) {
        console.log("Certificado não encontrado no arquivo");
        throw new Error("Certificado não encontrado no arquivo");
      }

      // Verifica a validade do certificado
      const cert = result.cert;
      const notBefore = new Date(cert.notBefore);
      const notAfter = new Date(cert.notAfter);
      const now = new Date();

      console.log("Datas do certificado:", {
        notBefore: notBefore.toISOString(),
        notAfter: notAfter.toISOString(),
        now: now.toISOString()
      });

      if (now < notBefore || now > notAfter) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Certificado ${now > notAfter ? 'expirado' : 'ainda não válido'}` 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Sucesso na validação
      console.log("Certificado válido até:", notAfter.toISOString());
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Certificado válido',
          validade: notAfter.toISOString()
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );

    } catch (error) {
      console.error('Erro específico na validação:', error);
      // Verifica se o erro é relacionado à senha incorreta
      const errorMessage = error.message?.toLowerCase() || '';
      const isSenhaIncorreta = 
        errorMessage.includes('mac verify failure') || 
        errorMessage.includes('invalid password') ||
        errorMessage.includes('wrong password');

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: isSenhaIncorreta ? 
            'Senha do certificado incorreta' : 
            'Erro ao validar certificado. Verifique se o arquivo e a senha estão corretos.'
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error('Erro geral na requisição:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
})
