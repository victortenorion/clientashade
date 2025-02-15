
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

    // Remover possíveis espaços em branco da senha
    const senhaLimpa = senha.trim();
    console.log("Senha processada (comprimento):", senhaLimpa.length);

    try {
      // Verificar se o certificado base64 é válido
      try {
        atob(certificado);
      } catch (e) {
        console.error("Certificado base64 inválido:", e);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Certificado base64 inválido' 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

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
      let result;
      try {
        result = await pkcs12.parse(certificateBytes, senhaLimpa);
        console.log("Parse do certificado bem sucedido");
      } catch (error) {
        console.error("Erro no parse do certificado:", error);
        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('mac verify failure') || 
            errorMessage.includes('invalid password') ||
            errorMessage.includes('wrong password') ||
            errorMessage.includes('invalid mac') ||
            errorMessage.includes('decrypt error')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Senha do certificado digital inválida',
              debug: errorMessage
            }),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Erro ao processar certificado digital',
            debug: errorMessage
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!result || !result.cert) {
        console.log("Certificado não encontrado no arquivo");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Certificado não encontrado no arquivo' 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Extrair informações do certificado
      const cert = result.cert;
      const notBefore = new Date(cert.notBefore);
      const notAfter = new Date(cert.notAfter);
      const now = new Date();

      console.log("Informações do certificado:", {
        emissor: cert.issuer,
        subject: cert.subject,
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
            message: `Certificado ${now > notAfter ? 'expirado' : 'ainda não válido'}`,
            validoAte: notAfter.toISOString(),
            validoDe: notBefore.toISOString()
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Verificar chave privada
      if (!result.key) {
        console.log("Chave privada não encontrada");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Chave privada não encontrada no certificado' 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Verificar se é um certificado ICP-Brasil
      const isICPBrasil = cert.issuer.some((issuerPart: any) => 
        issuerPart.value?.toLowerCase().includes('icp-brasil'));

      if (!isICPBrasil) {
        console.log("Certificado não é ICP-Brasil");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'O certificado não é ICP-Brasil' 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
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
            possuiChavePrivada: true,
            emissor: cert.issuer,
            subject: cert.subject
          }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );

    } catch (error) {
      console.error("Erro ao validar certificado:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erro ao validar certificado digital. Verifique se o arquivo está no formato correto (.pfx)',
          debug: error.message
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
