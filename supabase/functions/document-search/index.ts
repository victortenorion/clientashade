
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CNPJ_API_BASE = "https://publica.cnpj.ws/cnpj"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cleanCPF.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

const validateCNPJ = (cnpj: string) => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
  
  if (cleanCNPJ.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false

  let size = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, size)
  const digits = cleanCNPJ.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - sum % 11
  if (result !== parseInt(digits.charAt(0))) return false

  size = size + 1
  numbers = cleanCNPJ.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - sum % 11
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

const searchCNPJ = async (cnpj: string) => {
  try {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
    console.log('Buscando CNPJ:', cleanCNPJ)
    
    const response = await fetch(`${CNPJ_API_BASE}/${cleanCNPJ}`)
    console.log('Status da resposta:', response.status)
    
    if (!response.ok) {
      throw new Error(`CNPJ não encontrado: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Dados recebidos:', data)
    
    return {
      name: data.razao_social,
      document: cnpj,
      email: data.email || '',
      phone: data.telefone1 || '',
      address: `${data.estabelecimento.tipo_logradouro} ${data.estabelecimento.logradouro} ${data.estabelecimento.numero}, ${data.estabelecimento.bairro}, ${data.estabelecimento.cidade.nome} - ${data.estabelecimento.estado.sigla}, ${data.estabelecimento.cep}`,
    }
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error)
    throw new Error(`Erro ao buscar dados do CNPJ: ${error.message}`)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { document } = await req.json()
    
    if (!document) {
      return new Response(
        JSON.stringify({ error: 'Documento não fornecido' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    console.log('Documento recebido:', document)
    const cleanDocument = document.replace(/[^\d]/g, '')
    
    if (cleanDocument.length === 14) {
      const isValid = validateCNPJ(cleanDocument)
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'CNPJ inválido' }),
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
        const apiData = await searchCNPJ(cleanDocument)
        return new Response(
          JSON.stringify({ apiData }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        )
      } catch (error) {
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
    } else {
      return new Response(
        JSON.stringify({ error: 'Documento inválido' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }
  } catch (error) {
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
