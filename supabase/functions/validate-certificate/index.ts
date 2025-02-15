
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
    console.log("Tamanho do certificado:", certificado?.length || 0);
    console.log("Senha fornecida:", senha ? "Sim" : "Não");
    
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
      // Decodificar o certificado base64
      console.log("Iniciando decodificação base64");
      const binaryString = atob(certificado);
      console.log("Certificado decodificado de base64, tamanho:", binaryString.length);
      
      // Converter para Uint8Array
      const certificateBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        certificateBytes[i] = binaryString.charCodeAt(i);
      }
      console.log("Array de bytes criado, tamanho:", certificateBytes.length);

      // Tentar parsear o certificado
      console.log("Tentando parsear o certificado PKCS#12...");
      const result = await pkcs12.parse(certificateBytes, senha);
      console.log("Resultado do parse:", result ? "Sucesso" : "Falha");

      if (!result || !result.cert) {
        console.log("Certificado não encontrado no arquivo");
        throw new Error("Certificado não encontrado no arquivo");
      }

      // Extrair informações do certificado
      const cert = result.cert;
      const notBefore = new Date(cert.notBefore);
      const notAfter = new Date(cert.notAfter);
      const now = new Date();

      console.log("Datas do certificado:", {
        notBefore: notBefore.toISOString(),
        notAfter: notAfter.toISOString(),
        now: now.toISOString()
      });

      // Verificar validade do certificado
      if (now < notBefore || now > notAfter) {
        console.log("Certificado fora do período de validade");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Certificado ${now > notAfter ? 'expirado' : 'ainda não válido'}` 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Verificar chave privada
      if (!result.key) {
        console.log("Chave privada não encontrada");
        throw new Error("Chave privada não encontrada no certificado");
      }

      console.log("Certificado validado com sucesso");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Certificado digital válido',
          validade: notAfter.toISOString(),
          info: {
            validoAte: notAfter.toISOString(),
            validoDe: notBefore.toISOString(),
            possuiChavePrivada: true
          }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );

    } catch (error) {
      console.error("Erro ao validar certificado:", error);
      
      const errorMessage = error.message?.toLowerCase() || '';
      const isSenhaIncorreta = 
        errorMessage.includes('mac verify failure') || 
        errorMessage.includes('invalid password') ||
        errorMessage.includes('wrong password') ||
        errorMessage.includes('invalid mac') ||
        errorMessage.includes('decrypt error');

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: isSenhaIncorreta ? 
            'Senha do certificado digital inválida' : 
            'Erro ao validar certificado digital. Verifique se o arquivo está no formato correto (.pfx)'
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("Erro geral na requisição:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor ao processar o certificado digital',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
})
