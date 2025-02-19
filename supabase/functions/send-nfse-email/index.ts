
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
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
          email
        ),
        clients (
          name,
          email
        )
      `)
      .eq('id', nfseId)
      .single()

    if (nfseError) throw nfseError

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: `${nfse.company_info.razao_social} <${nfse.company_info.email}>`,
      to: [nfse.clients.email],
      subject: `NFS-e nº ${nfse.numero_nfse}`,
      html: `
        <h1>Nota Fiscal de Serviço Eletrônica</h1>
        <p>Prezado(a) ${nfse.clients.name},</p>
        <p>Segue em anexo sua NFS-e nº ${nfse.numero_nfse}.</p>
        <p>Atenciosamente,<br>${nfse.company_info.razao_social}</p>
      `,
      attachments: [
        {
          filename: `nfse_${nfse.numero_nfse}.pdf`,
          content: nfse.pdf_url.split('base64,')[1],
        },
      ],
    })

    return new Response(
      JSON.stringify(emailResponse),
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
