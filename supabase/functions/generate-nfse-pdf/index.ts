
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as base64 from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurações do Supabase não encontradas')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { nfseId } = await req.json()

    // Buscar dados da NFS-e
    const { data: nfse, error: nfseError } = await supabase
      .from('nfse')
      .select(`
        *,
        company_info (
          razao_social,
          cnpj,
          inscricao_municipal,
          endereco_logradouro,
          endereco_numero,
          endereco_complemento,
          endereco_bairro,
          endereco_cidade,
          endereco_uf,
          endereco_cep
        ),
        clients (
          name,
          document,
          email,
          street,
          street_number,
          complement,
          neighborhood,
          city,
          state,
          zip_code
        )
      `)
      .eq('id', nfseId)
      .single()

    if (nfseError) throw nfseError

    // Simular geração do PDF (em produção, usar uma biblioteca real de PDF)
    const pdfContent = `
      NFS-e nº ${nfse.numero_nfse}
      
      PRESTADOR:
      ${nfse.company_info.razao_social}
      CNPJ: ${nfse.company_info.cnpj}
      
      TOMADOR:
      ${nfse.clients.name}
      Documento: ${nfse.clients.document}
      
      SERVIÇO:
      ${nfse.discriminacao_servicos}
      
      VALOR: R$ ${nfse.valor_servicos}
    `

    // Converter para Base64 (simulando um PDF)
    const pdfBase64 = base64.encode(new TextEncoder().encode(pdfContent))

    // Atualizar a NFS-e com a URL do PDF
    const { error: updateError } = await supabase
      .from('nfse')
      .update({
        pdf_url: `data:application/pdf;base64,${pdfBase64}`
      })
      .eq('id', nfseId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ pdf: `data:application/pdf;base64,${pdfBase64}` }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
