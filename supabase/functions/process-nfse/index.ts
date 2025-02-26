
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { SOAPClient } from "https://deno.land/x/deno_soap@0.1.0/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const SEFAZ_ENDPOINT = "https://nfe.prefeitura.sp.gov.br/ws/lotenfse.asmx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nfseId } = await req.json();

    // Buscar dados da NFS-e e configurações
    const { data: nfse, error: fetchError } = await supabase
      .from("nfse")
      .select(`
        *,
        clients (
          name,
          email,
          cpf_cnpj
        ),
        nfse_sp_settings (
          cnpj,
          inscricao_municipal,
          usuario,
          senha
        )
      `)
      .eq("id", nfseId)
      .single();

    if (fetchError || !nfse) throw new Error("NFS-e não encontrada");
    if (!nfse.nfse_sp_settings) {
      await supabase
        .from("nfse")
        .update({ status_sefaz: "rejeitada", updated_at: new Date().toISOString() })
        .eq("id", nfseId);
      throw new Error("Configurações da NFS-e SP não encontradas");
    }

    // Construct XML data
    const xmlData = {
      Envelope: {
        "@_xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
        Body: {
          EnviarLoteRpsRequest: {
            "@_xmlns": "http://nfe.prefeitura.sp.gov.br",
            LoteRps: {
              "@_Id": `LOTE${nfseId}`,
              Cnpj: nfse.nfse_sp_settings.cnpj,
              InscricaoMunicipal: nfse.nfse_sp_settings.inscricao_municipal,
              QuantidadeRps: "1",
              ListaRps: {
                Rps: {
                  "@_Id": `RPS${nfse.numero_nfse || Date.now()}`,
                  IdentificacaoRps: {
                    Numero: nfse.numero_nfse || Date.now().toString(),
                    Serie: "RPS",
                    Tipo: "1",
                  },
                  DataEmissao: nfse.data_emissao || new Date().toISOString().split("T")[0],
                  NaturezaOperacao: "1",
                  RegimeEspecialTributacao: "0",
                  OptanteSimplesNacional: "2",
                  IncentivadorCultural: "2",
                  Status: "1",
                  Servico: {
                    Valores: {
                      ValorServicos: nfse.valor_servicos,
                      ValorDeducoes: "0.00",
                      ValorPis: "0.00",
                      ValorCofins: "0.00",
                      ValorInss: "0.00",
                      ValorIr: "0.00",
                      ValorCsll: "0.00",
                      IssRetido: "2",
                      ValorIss: "0.00",
                      Aliquota: "0.00",
                    },
                    ItemListaServico: "0107",
                    CodigoTributacaoMunicipio: "12345",
                    Discriminacao: nfse.discriminacao_servicos,
                    CodigoMunicipio: "3550308",
                  },
                  Prestador: {
                    Cnpj: nfse.nfse_sp_settings.cnpj,
                    InscricaoMunicipal: nfse.nfse_sp_settings.inscricao_municipal,
                  },
                  Tomador: {
                    IdentificacaoTomador: {
                      CpfCnpj: {
                        Cnpj: nfse.clients.cpf_cnpj.length > 11 ? nfse.clients.cpf_cnpj : undefined,
                        Cpf: nfse.clients.cpf_cnpj.length <= 11 ? nfse.clients.cpf_cnpj : undefined,
                      },
                    },
                    RazaoSocial: nfse.clients.name,
                    Endereco: {
                      Endereco: "Rua Exemplo",
                      Numero: "123",
                      Bairro: "Centro",
                      CodigoMunicipio: "3550308",
                      Uf: "SP",
                      Cep: "01000000",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    // Convert to XML string
    const buildXMLString = (obj: any): string => {
      const entries = Object.entries(obj);
      return entries.map(([key, value]) => {
        if (key.startsWith('@_')) {
          return '';
        }
        if (typeof value === 'object') {
          const attrs = Object.entries(value)
            .filter(([k]) => k.startsWith('@_'))
            .map(([k, v]) => `${k.slice(2)}="${v}"`)
            .join(' ');
          const content = buildXMLString(value);
          return `<${key}${attrs ? ' ' + attrs : ''}>${content}</${key}>`;
        }
        return `<${key}>${value}</${key}>`;
      }).join('');
    };

    const xml = `<?xml version="1.0" encoding="UTF-8"?>${buildXMLString(xmlData)}`;

    // Send to SEFAZ via SOAP
    const soapClient = new SOAPClient(SEFAZ_ENDPOINT);
    const response = await soapClient.call("EnviarLoteRps", xml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://nfe.prefeitura.sp.gov.br/EnviarLoteRps",
      },
      auth: {
        username: nfse.nfse_sp_settings.usuario,
        password: nfse.nfse_sp_settings.senha,
      },
    });

    const success = !response.body.includes("soap:Fault");
    const xmlRetorno = response.body;

    // Update status in Supabase
    const updateData = {
      status_sefaz: success ? "autorizada" : "rejeitada",
      xml_envio: xml,
      xml_retorno: xmlRetorno,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("nfse")
      .update(updateData)
      .eq("id", nfseId);

    // Log operation
    await supabase
      .from("nfse_sefaz_logs")
      .insert({
        nfse_id: nfseId,
        status: success ? "autorizada" : "rejeitada",
        message: success ? "NFS-e autorizada" : "Falha na autorização",
        request_payload: xml,
        response_payload: xmlRetorno,
      });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in process-nfse function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
