
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as forge from "npm:node-forge@1.3.1";

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
      let certificadoBase64 = certificado;
      
      // Remover prefixo data URL se existir
      if (certificadoBase64.includes('base64,')) {
        certificadoBase64 = certificadoBase64.split('base64,')[1];
      }

      // Verificar se o certificado base64 é válido
      try {
        atob(certificadoBase64);
      } catch (e) {
        console.error("Certificado base64 inválido:", e);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Certificado inválido: formato base64 incorreto' 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Decodificar o certificado base64
      console.log("Iniciando decodificação base64");
      const binaryString = atob(certificadoBase64);
      console.log("Certificado decodificado de base64, tamanho:", binaryString.length);
      
      // Converter string binária para Buffer compatível com node-forge
      const buffer = forge.util.createBuffer(binaryString, 'raw');
      const asn1 = forge.asn1.fromDer(buffer);

      // Tentar parsear o certificado
      console.log("Tentando parsear o certificado PKCS#12...");
      let pkcs12;
      try {
        pkcs12 = forge.pkcs12.pkcs12FromAsn1(asn1, senhaLimpa);
        console.log("Parse do certificado bem sucedido");
      } catch (error: any) {
        console.error("Erro detalhado no parse do certificado:", {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        if (error.message?.toLowerCase().includes('invalid password')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Senha do certificado digital inválida' 
            }),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Erro ao processar certificado digital',
            error: error.message
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Extrair certificados
      const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
      
      if (!certBags || certBags.length === 0) {
        console.log("Certificado não encontrado no arquivo");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Certificado não encontrado no arquivo' 
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Obter o primeiro certificado
      const cert = certBags[0].cert;
      const now = new Date();
      const notBefore = cert.validity.notBefore;
      const notAfter = cert.validity.notAfter;

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
      const keyBags = pkcs12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
      if (!keyBags || keyBags.length === 0) {
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
      const isICPBrasil = cert.issuer.getField('O')?.value?.toLowerCase().includes('icp-brasil');

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
            emissor: cert.issuer.attributes.map((attr: any) => ({
              name: attr.name,
              value: attr.value
            })),
            subject: cert.subject.attributes.map((attr: any) => ({
              name: attr.name,
              value: attr.value
            }))
          }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );

    } catch (error: any) {
      console.error("Erro detalhado na validação:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erro ao validar certificado digital',
          error: error.message
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error: any) {
    console.error("Erro detalhado na requisição:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
})
