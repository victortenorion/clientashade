// supabase/functions/process-nfse/index.ts
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { XMLBuilder, XMLParser } from "https://deno.land/x/fast_xml_parser@4.4.1";
import { SOAPClient } from "https://deno.land/x/deno_soap@0.1.0/mod.ts"; // Dependência SOAP

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const SEFAZ_ENDPOINT = "https://nfe.prefeitura.sp.gov.br/ws/lotenfse.asmx";

serve(async (req) => {
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

    // Gerar XML para o lote RPS
    const xmlData = {
      "?xml": { "@@version": "1.0", "@@encoding": "UTF-8" },
      "soap:Envelope": {
        "@@xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "@@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@@xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
        "soap:Body": {
          EnviarLoteRpsRequest: {
            "@@xmlns": "http://nfe.prefeitura.sp.gov.br",
            LoteRps: {
              "@@Id": `LOTE${nfseId}`,
              Cnpj: nfse.nfse_sp_settings.cnpj,
              InscricaoMunicipal: nfse.nfse_sp_settings.inscricao_municipal,
              QuantidadeRps: "1",
              ListaRps: {
                Rps: {
                  "@@Id": `RPS${nfse.numero_nfse || Date.now()}`,
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
                    ItemListaServico: "0107", // Ajustar conforme serviço real
                    CodigoTributacaoMunicipio: "12345", // Consultar manual
                    Discriminacao: nfse.discriminacao_servicos,
                    CodigoMunicipio: "3550308", // São Paulo
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
                      Endereco: "Rua Exemplo", // Substituir por dados reais
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

    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xml = builder.build(xmlData);

    // Enviar para SEFAZ via SOAP
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

    const parser = new XMLParser();
    const parsedResponse = parser.parse(response.body);
    const success = !parsedResponse["soap:Envelope"]["soap:Body"]["soap:Fault"];
    const xmlRetorno = response.body;

    // Atualizar status no Supabase
    const updateData = {
      status_sefaz: success ? "autorizada" : "rejeitada",
      xml_envio: xml,
      xml_retorno: xmlRetorno,
      updated_at: new Date().toISOString(),
    };
    if (success) {
      updateData.numero_nfse = parsedResponse["soap:Envelope"]["soap:Body"]["EnviarLoteRpsResponse"]["NumeroLote"];
    }

    await supabase
      .from("nfse")
      .update(updateData)
      .eq("id", nfseId);

    // Log da operação
    await supabase
      .from("nfse_sefaz_logs")
      .insert({
        nfse_id: nfseId,
        status: success ? "autorizada" : "rejeitada",
        message: success ? "NFS-e autorizada" : "Falha na autorização",
        request_payload: xml,
        response_payload: xmlRetorno,
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro ao processar NFS-e:", error);
    await supabase
      .from("nfse")
      .update({
        status_sefaz: "rejeitada",
        xml_retorno: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", nfseId);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
