
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NFSeData {
  nfseId: string;
}

interface MissingFieldData {
  missing_field: string | null;
  field_value: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nfseId } = await req.json() as NFSeData;

    console.log('Buscando NFS-e com ID:', nfseId);

    // Primeiro buscar os dados da NFS-e com todas as configurações necessárias
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse')
      .select(`
        *,
        nfse_sp_settings:nfse_sp_settings_id (*),
        fiscal_config:fiscal_config (
          config
        )
      `)
      .eq('id', nfseId)
      .single();

    if (nfseError) {
      console.error('Erro ao buscar NFS-e:', nfseError);
      throw new Error(`Erro ao buscar NFS-e: ${nfseError.message}`);
    }

    if (!nfse) {
      throw new Error('NFS-e não encontrada');
    }

    console.log('NFS-e encontrada:', {
      id: nfse.id,
      settings: nfse.nfse_sp_settings ? 'presente' : 'ausente',
      fiscal_config: nfse.fiscal_config ? 'presente' : 'ausente'
    });

    const settings = nfse.nfse_sp_settings;
    const fiscalConfig = nfse.fiscal_config?.config;

    // Verificar dados obrigatórios
    const requiredFields = [
      { field: 'settings', value: settings, message: 'Configurações da NFS-e' },
      { field: 'fiscal_config', value: fiscalConfig, message: 'Configurações fiscais' },
      { field: 'fiscal_config.certificado_digital', value: fiscalConfig?.certificado_digital, message: 'Certificado digital' },
      { field: 'fiscal_config.senha_certificado', value: fiscalConfig?.senha_certificado, message: 'Senha do certificado' },
      { field: 'settings.usuario_emissor', value: settings?.usuario_emissor, message: 'Usuário do emissor' },
      { field: 'settings.senha_emissor', value: settings?.senha_emissor, message: 'Senha do emissor' },
      { field: 'settings.codigo_municipio', value: settings?.codigo_municipio, message: 'Código do município' },
      { field: 'settings.inscricao_municipal', value: settings?.inscricao_municipal, message: 'Inscrição Municipal' }
    ];

    for (const field of requiredFields) {
      if (!field.value) {
        console.error(`Campo obrigatório faltando: ${field.field}`);
        throw new Error(`${field.message} não encontrado(a)`);
      }
    }

    const endpoint = settings.ambiente === 'producao'
      ? 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx'
      : 'https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx';

    console.log('Tentando acessar endpoint:', endpoint);
    console.log('Ambiente:', settings.ambiente);

    const inscricaoMunicipalLimpa = settings.inscricao_municipal.replace(/\D/g, '');

    console.log('Inscrição Municipal formatada:', inscricaoMunicipalLimpa);

    // Criar credenciais em Base64
    const credentials = encode(`${settings.usuario_emissor}:${settings.senha_emissor}`);

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <ConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>1</VersaoSchema>
      <MensagemXML>
        <![CDATA[<?xml version="1.0" encoding="UTF-8"?>
        <ConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <Cabecalho Versao="1">
            <CPFCNPJRemetente>
              <CNPJ>${settings.codigo_municipio}</CNPJ>
            </CPFCNPJRemetente>
          </Cabecalho>
          <Detalhe>
            <ChaveNFe>
              <InscricaoPrestador>${inscricaoMunicipalLimpa}</InscricaoPrestador>
              <NumeroNFe>${nfse.numero_nfse}</NumeroNFe>
            </ChaveNFe>
          </Detalhe>
        </ConsultaNFe>]]>
      </MensagemXML>
    </ConsultaNFe>
  </soap12:Body>
</soap12:Envelope>`;

    console.log('Enviando requisição SOAP:', soapEnvelope);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let httpsOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml;charset=UTF-8',
          'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFe',
          'User-Agent': 'Mozilla/5.0',
          'Accept': '*/*',
          'Connection': 'keep-alive',
          'Accept-Encoding': 'gzip, deflate, br',
          'Authorization': `Basic ${credentials}`
        },
        body: soapEnvelope,
        signal: controller.signal,
        mode: 'cors' as RequestMode,
      };

      // Adicionando certificado se disponível
      if (fiscalConfig.certificado_digital) {
        console.log('Usando certificado digital');
        httpsOptions = {
          ...httpsOptions,
          //@ts-ignore
          cert: fiscalConfig.certificado_digital,
          key: fiscalConfig.certificado_digital,
          passphrase: fiscalConfig.senha_certificado,
          rejectUnauthorized: false,
        };
      }

      const response = await fetch(endpoint, httpsOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta com erro da SEFAZ:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Resposta da consulta:', responseText);

      let novoStatus = 'processando';
      if (responseText.includes('<Situacao>C</Situacao>')) {
        novoStatus = 'cancelada';
      } else if (responseText.includes('<Situacao>N</Situacao>')) {
        novoStatus = 'autorizada';
      } else if (responseText.includes('<Erro>')) {
        novoStatus = 'rejeitada';
      }

      const { error: updateError } = await supabaseClient
        .from('nfse')
        .update({
          status_sefaz: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', nfseId);

      if (updateError) {
        throw updateError;
      }

      await supabaseClient
        .from('nfse_sefaz_logs')
        .insert({
          nfse_id: nfseId,
          status: novoStatus,
          request_payload: { 
            xml: soapEnvelope,
            headers: httpsOptions.headers
          },
          response_payload: { xml: responseText }
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: novoStatus,
          message: `Status da NFS-e atualizado para ${novoStatus}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      console.error('Erro na requisição SOAP:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout na comunicação com a SEFAZ');
      }
      
      throw new Error(`Erro na comunicação com a SEFAZ: ${fetchError.message}`);
    }

  } catch (error) {
    console.error('Erro ao processar NFS-e:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
