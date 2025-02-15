import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SPNFSeData {
  tpAmb: string;
  versao: string;
  prestador: {
    cnpj: string;
    inscricaoMunicipal: string;
    tipo_documento?: string;
  };
  tomador: {
    cnpj?: string;
    cpf?: string;
    inscricaoMunicipal?: string;
    razaoSocial: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      uf: string;
      cep: string;
    };
    email?: string;
  };
  servico: {
    valorServicos: number;
    codigoServico: string;
    discriminacao: string;
    codigoMunicipio: string;
    responsavelRetencao?: string;
    itemListaServico: string;
    codigoLocalPrestacao?: string;
    issRetido: boolean;
    exigibilidade: string;
    operacao: string;
    aliquota: number;
    valorDeducoes?: number;
    outrasRetencoes?: number;
    baseCalculo?: number;
    percentualReducaoBaseCalculo?: number;
  };
  intermediario?: {
    cnpj?: string;
    inscricaoMunicipal?: string;
    email?: string;
  };
  rps: {
    numero: string;
    serie: string;
    tipo: string;
    dataEmissao: string;
    status: string;
    tributacao: string;
  };
  options: {
    regimeEspecialTributacao?: string;
    optanteSimplesNacional: boolean;
    incentivadorCultural: boolean;
  };
  proxy?: {
    host?: string;
    port?: string;
    host_ssl?: string;
    port_ssl?: string;
  };
  wsdl?: {
    homologacao: string;
    producao: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Iniciando processamento da NFS-e');

    const { nfseId } = await req.json();

    if (!nfseId) {
      throw new Error('ID da NFS-e não informado');
    }

    // Verificar se a nota já não está em processamento
    const { data: queueCheck, error: queueCheckError } = await supabase
      .from('sefaz_transmission_queue')
      .select('*')
      .eq('documento_id', nfseId)
      .eq('tipo', 'nfse')
      .eq('status', 'processando')
      .maybeSingle();

    if (queueCheckError) {
      console.error('Erro ao verificar fila:', queueCheckError);
      throw queueCheckError;
    }

    if (queueCheck) {
      throw new Error('NFS-e já está em processamento');
    }

    // Buscar dados da NFS-e com informações relacionadas
    const { data: nfse, error: nfseError } = await supabase
      .from('nfse')
      .select(`
        *,
        clients(
          id,
          name,
          document,
          municipal_registration,
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
      .maybeSingle();

    if (nfseError) {
      console.error('Erro ao buscar NFS-e:', nfseError);
      throw nfseError;
    }

    if (!nfse) {
      throw new Error('NFS-e não encontrada');
    }

    // Buscar dados da empresa
    const { data: companyInfo, error: companyError } = await supabase
      .from('company_info')
      .select('*')
      .maybeSingle();

    if (companyError) {
      console.error('Erro ao buscar dados da empresa:', companyError);
      throw companyError;
    }

    if (!companyInfo) {
      throw new Error('Dados da empresa não encontrados');
    }

    // Buscar configurações SP
    const { data: spSettings, error: spError } = await supabase
      .from('nfse_sp_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (spError) {
      console.error('Erro ao buscar configurações SP:', spError);
      throw spError;
    }

    if (!spSettings) {
      throw new Error('Configurações SP não encontradas');
    }

    // Incrementar número do RPS
    const { data: rpsData, error: rpsError } = await supabase
      .rpc('increment_rps_numero')
      .single();

    if (rpsError) {
      console.error('Erro ao incrementar RPS:', rpsError);
      throw rpsError;
    }

    // Criar ou atualizar registro na fila
    const { error: queueError } = await supabase
      .from('sefaz_transmission_queue')
      .upsert({
        documento_id: nfseId,
        tipo: 'nfse',
        status: 'processando',
        tentativas: 0,
        ultima_tentativa: new Date().toISOString()
      });

    if (queueError) {
      console.error('Erro ao atualizar fila:', queueError);
      throw queueError;
    }

    // Atualizar NFSe com info do RPS
    const { error: nfseUpdateError } = await supabase
      .from('nfse')
      .update({
        numero_rps: rpsData.ultima_rps_numero.toString(),
        serie_rps: rpsData.serie_rps_padrao,
        tipo_rps: rpsData.tipo_rps,
        status_sefaz: 'processando',
        data_emissao_rps: new Date().toISOString(),
      })
      .eq('id', nfseId);

    if (nfseUpdateError) {
      console.error('Erro ao atualizar NFS-e:', nfseUpdateError);
      throw nfseUpdateError;
    }

    // Preparar dados para SP NFSe
    const spNFSeData: SPNFSeData = {
      tpAmb: nfse.ambiente === 'producao' ? '1' : '2',
      versao: spSettings.versao_schema || '2.00',
      prestador: {
        cnpj: companyInfo.cnpj.replace(/\D/g, ''),
        inscricaoMunicipal: companyInfo.inscricao_municipal,
        tipo_documento: spSettings.tipo_documento
      },
      tomador: {
        cnpj: nfse.clients.document?.replace(/\D/g, ''),
        inscricaoMunicipal: nfse.clients.municipal_registration,
        razaoSocial: nfse.clients.name,
        endereco: {
          logradouro: nfse.clients.street || '',
          numero: nfse.clients.street_number || '',
          complemento: nfse.clients.complement || '',
          bairro: nfse.clients.neighborhood || '',
          codigoMunicipio: companyInfo.endereco_codigo_municipio || '',
          uf: nfse.clients.state || '',
          cep: (nfse.clients.zip_code || '').replace(/\D/g, ''),
        },
        email: nfse.clients.email,
      },
      servico: {
        valorServicos: nfse.valor_servicos,
        codigoServico: nfse.codigo_servico,
        discriminacao: nfse.discriminacao_servicos,
        codigoMunicipio: companyInfo.endereco_codigo_municipio || '',
        codigoLocalPrestacao: nfse.local_servico || spSettings.servico_codigo_local_prestacao,
        issRetido: nfse.retencao_iss || false,
        exigibilidade: spSettings.servico_exigibilidade || '1',
        operacao: spSettings.servico_operacao || '1',
        responsavelRetencao: nfse.responsavel_retencao || 'cliente',
        itemListaServico: nfse.codigo_servico || spSettings.servico_codigo_item_lista,
        aliquota: spSettings.servico_aliquota || 0,
        valorDeducoes: nfse.deducoes || 0,
        baseCalculo: spSettings.servico_valor_base_calculo || nfse.valor_servicos,
        percentualReducaoBaseCalculo: spSettings.servico_percentual_reducao_base_calculo || 0,
        outrasRetencoes: nfse.outras_retencoes || 0,
      },
      rps: {
        numero: rpsData.ultima_rps_numero.toString(),
        serie: rpsData.serie_rps_padrao,
        tipo: rpsData.tipo_rps,
        dataEmissao: new Date().toISOString(),
        status: spSettings.rps_status || 'N',
        tributacao: nfse.tributacao_rps || 'T',
      },
      options: {
        regimeEspecialTributacao: nfse.codigo_regime_especial_tributacao || spSettings.tipo_regime_especial,
        optanteSimplesNacional: spSettings.codigo_regime_tributario === '1',
        incentivadorCultural: nfse.prestador_incentivador_cultural || false,
      },
      proxy: {
        host: spSettings.proxy_host,
        port: spSettings.proxy_port,
        host_ssl: spSettings.proxy_host_ssl,
        port_ssl: spSettings.proxy_port_ssl
      },
      wsdl: {
        homologacao: spSettings.wsdl_homologacao_url,
        producao: spSettings.wsdl_producao_url
      }
    };

    // Log de processamento inicial
    await supabase
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseId,
        status: 'processing',
        message: 'Iniciando processamento da NFS-e',
        request_payload: spNFSeData,
        response_payload: null
      });

    // Aqui seria o envio efetivo para a SEFAZ
    // Por enquanto vamos simular um processamento "em processamento"
    const processResponse = {
      status: 'processando',
      message: 'NFS-e em processamento pela SEFAZ'
    };

    // Atualizar status da nota para "processando"
    const { error: updateStatusError } = await supabase
      .from('nfse')
      .update({
        status_sefaz: 'processando',
        data_emissao_rps: new Date().toISOString()
      })
      .eq('id', nfseId);

    if (updateStatusError) {
      throw updateStatusError;
    }

    // Atualizar status da fila
    const { error: updateQueueError } = await supabase
      .from('sefaz_transmission_queue')
      .update({
        status: 'processando',
        ultima_tentativa: new Date().toISOString()
      })
      .eq('documento_id', nfseId)
      .eq('tipo', 'nfse');

    if (updateQueueError) {
      throw updateQueueError;
    }

    // Log do envio inicial
    await supabase
      .from('nfse_sefaz_logs')
      .insert({
        nfse_id: nfseId,
        status: 'processing',
        message: 'NFS-e enviada para processamento na SEFAZ',
        request_payload: spNFSeData,
        response_payload: processResponse
      });

    console.log('Processamento iniciado com sucesso');

    // TODO: Implementar consulta assíncrona do status real na SEFAZ
    // Isso deve ser feito em um processo separado que consulta periodicamente
    // o status na SEFAZ e atualiza o status_sefaz quando houver confirmação

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          ...spNFSeData,
          status: 'processando'
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Erro no processamento da NFS-e:', error);

    try {
      const { nfseId } = await req.json();
      if (nfseId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Log do erro
        await supabase
          .from('nfse_sefaz_logs')
          .insert({
            nfse_id: nfseId,
            status: 'error',
            message: error.message,
            request_payload: { nfseId },
            response_payload: { error: error.message }
          });

        // Atualizar status da NFS-e
        await supabase
          .from('nfse')
          .update({
            status_sefaz: 'erro'
          })
          .eq('id', nfseId);

        // Atualizar status da fila
        await supabase
          .from('sefaz_transmission_queue')
          .update({ 
            status: 'erro',
            erro_mensagem: error.message,
            ultima_tentativa: new Date().toISOString()
          })
          .eq('documento_id', nfseId)
          .eq('tipo', 'nfse');
      }
    } catch (logError) {
      console.error('Erro ao registrar log de erro:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
