import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { NFSeForm } from "./NFSeForm";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import type { NFSeFormData } from "../types/nfse.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface ServiceOrder {
  id: string;
  order_number: string;
  equipment: string | null;
  equipment_serial_number: string | null;
  total_price: number;
  items: ServiceOrderItem[];
  client: {
    id: string;
    name: string;
    document: string;
    email: string;
    street: string;
    street_number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    municipal_registration: string;
    state_registration: string;
  };
}

interface ServiceOrderItem {
  description: string;
  price: number;
  quantity?: number;
}

interface ServiceOrderNFSeProps {
  serviceOrderId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ServiceOrderNFSe: React.FC<ServiceOrderNFSeProps> = ({
  serviceOrderId,
  onSubmit,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<NFSeFormData>({
    client_id: "",
    tipo_registro: "2",
    tipo_rps: "RPS",
    serie_rps: "1",
    numero_rps: "",
    data_emissao: new Date().toISOString().split("T")[0],
    data_competencia: new Date().toISOString().split("T")[0],
    data_fato_gerador: new Date().toISOString().split("T")[0],
    inscricao_prestador: "",
    tipo_documento_prestador: "2",
    documento_prestador: "",
    razao_social_prestador: "",
    tipo_endereco_prestador: "R",
    endereco_prestador: "",
    numero_endereco_prestador: "",
    complemento_endereco_prestador: "",
    bairro_prestador: "",
    cidade_prestador: "",
    uf_prestador: "",
    cep_prestador: "",
    email_prestador: "",
    codigo_servico: "",
    discriminacao_servicos: "",
    valor_servicos: 0,
    valor_deducoes: 0,
    deducoes: 0,
    aliquota_iss: 0,
    valor_iss: 0,
    iss_retido: "N",
    tipo_documento_tomador: "2",
    documento_tomador: "",
    razao_social_tomador: "",
    inscricao_municipal_tomador: "",
    inscricao_estadual_tomador: "",
    tipo_endereco_tomador: "R",
    endereco_tomador: "",
    numero_endereco_tomador: "",
    complemento_endereco_tomador: "",
    bairro_tomador: "",
    cidade_tomador: "",
    uf_tomador: "",
    cep_tomador: "",
    email_tomador: "",
    valor_pis: 0,
    valor_cofins: 0,
    valor_inss: 0,
    valor_ir: 0,
    valor_csll: 0,
    outras_retencoes: 0,
    valor_carga_tributaria: 0,
    percentual_carga_tributaria: 0,
    percentual_tributos_ibpt: 0,
    valor_total: 0,
    status_transmissao: "pendente",
    status_sefaz: "pendente",
    situacao_nota: "T",
    opcao_simples: "4",
    natureza_operacao: "1",
    retencao_ir: false,
    percentual_ir: 0,
    retencao_iss: false,
    desconto_iss: false,
    retencao_inss: false,
    retencao_pis_cofins_csll: false,
    desconto_incondicional: 0,
    comissao_percentual: 0,
    responsavel_retencao: "tomador",
    local_servico: "tomador",
    aliquota_pis: 0,
    aliquota_cofins: 0,
    aliquota_csll: 0
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServiceOrder = async () => {
      try {
        const { data: companyInfo, error: companyError } = await supabase
          .from("company_info")
          .select(`
            cnpj,
            inscricao_municipal,
            razao_social,
            endereco_logradouro,
            endereco_numero,
            endereco_complemento,
            endereco_bairro,
            endereco_cidade,
            endereco_uf,
            endereco_cep,
            email,
            codigo_servico,
            regime_tributario
          `)
          .maybeSingle();

        if (companyError) throw companyError;

        const { data: spSettings, error: spError } = await supabase
          .from("nfse_sp_settings")
          .select("*")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: spConfig, error: spConfigError } = await supabase
          .from("nfse_sp_config")
          .select("numero_inicial_rps, ultima_rps_numero")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (spError) throw spError;
        if (spConfigError) throw spConfigError;

        const { data: serviceOrder, error } = await supabase
          .from("service_orders")
          .select(`
            id,
            order_number,
            equipment,
            equipment_serial_number,
            total_price,
            items:service_order_items(description, price, quantity),
            client:clients(
              id,
              name,
              document,
              email,
              street,
              street_number,
              complement,
              neighborhood,
              city,
              state,
              zip_code,
              municipal_registration,
              state_registration
            )
          `)
          .eq("id", serviceOrderId)
          .single();

        if (error) throw error;

        if (serviceOrder && companyInfo) {
          const typedServiceOrder = serviceOrder as unknown as ServiceOrder;
          
          // Formata a descrição dos serviços incluindo a ordem de serviço, equipamento e itens
          const itemsDescription = typedServiceOrder.items.map(item => 
            `${item.description} (${item.quantity || 1} Quantidade x R$${item.price.toFixed(2)})`
          ).join(", ");

          const servicesDescription = `OS ${typedServiceOrder.order_number} - ${
            typedServiceOrder.equipment ? `${typedServiceOrder.equipment}${
              typedServiceOrder.equipment_serial_number ? ` - SN: ${typedServiceOrder.equipment_serial_number}` : ''
            }` : 'Equipamento não especificado'
          } - ${itemsDescription}`;

          // Calcula o próximo número de RPS
          let proximoNumeroRPS: string = "1";
          if (spConfig) {
            if (spConfig.numero_inicial_rps && spConfig.numero_inicial_rps > 0) {
              if (!spConfig.ultima_rps_numero || spConfig.ultima_rps_numero < spConfig.numero_inicial_rps) {
                proximoNumeroRPS = spConfig.numero_inicial_rps.toString();
              } else {
                proximoNumeroRPS = (spConfig.ultima_rps_numero + 1).toString();
              }
            } else {
              proximoNumeroRPS = ((spConfig.ultima_rps_numero || 0) + 1).toString();
            }
          }

          const valor_servicos = typedServiceOrder.total_price;
          const aliquota_iss = spSettings?.servico_aliquota || 0;
          const valor_iss = (valor_servicos * aliquota_iss) / 100;

          // Determina o tipo de documento do tomador baseado no tamanho do documento
          const tipo_documento_tomador = typedServiceOrder.client.document.length > 11 ? "2" : "1";

          setFormData(prevData => ({
            ...prevData,
            client_id: typedServiceOrder.client.id,
            tipo_registro: "2",
            data_emissao: new Date().toISOString().split("T")[0],
            data_competencia: new Date().toISOString().split("T")[0],
            data_fato_gerador: new Date().toISOString().split("T")[0],
            codigo_servico: companyInfo.codigo_servico || "",
            discriminacao_servicos: servicesDescription,
            valor_servicos: typedServiceOrder.total_price,
            valor_total: typedServiceOrder.total_price,
            numero_rps: proximoNumeroRPS,
            aliquota_iss,
            valor_iss,
            // Dados do prestador
            inscricao_prestador: companyInfo.inscricao_municipal || "",
            tipo_documento_prestador: "2",
            documento_prestador: companyInfo.cnpj || "",
            razao_social_prestador: companyInfo.razao_social || "",
            tipo_endereco_prestador: "R",
            endereco_prestador: companyInfo.endereco_logradouro || "",
            numero_endereco_prestador: companyInfo.endereco_numero || "",
            complemento_endereco_prestador: companyInfo.endereco_complemento || "",
            bairro_prestador: companyInfo.endereco_bairro || "",
            cidade_prestador: companyInfo.endereco_cidade || "",
            uf_prestador: companyInfo.endereco_uf || "",
            cep_prestador: companyInfo.endereco_cep || "",
            email_prestador: companyInfo.email || "",
            opcao_simples: companyInfo.regime_tributario || "4",
            // Dados do tomador
            tipo_documento_tomador,
            documento_tomador: typedServiceOrder.client.document,
            razao_social_tomador: typedServiceOrder.client.name,
            inscricao_municipal_tomador: typedServiceOrder.client.municipal_registration || "",
            inscricao_estadual_tomador: typedServiceOrder.client.state_registration || "",
            endereco_tomador: typedServiceOrder.client.street,
            numero_endereco_tomador: typedServiceOrder.client.street_number,
            complemento_endereco_tomador: typedServiceOrder.client.complement || "",
            bairro_tomador: typedServiceOrder.client.neighborhood,
            cidade_tomador: typedServiceOrder.client.city,
            uf_tomador: typedServiceOrder.client.state,
            cep_tomador: typedServiceOrder.client.zip_code,
            email_tomador: typedServiceOrder.client.email || ""
          }));
        }
      } catch (error: any) {
        console.error("Error fetching service order:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar ordem de serviço",
          description: error.message
        });
        navigate("/dashboard/service-orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceOrder();
  }, [serviceOrderId, toast, navigate]);

  const handleSubmit = async (data: NFSeFormData) => {
    try {
      setIsLoading(true);

      if (!data.client_id) {
        throw new Error("ID do cliente é obrigatório");
      }

      const { data: nfse, error: nfseError } = await supabase
        .from("nfse")
        .insert({
          ...data,
          service_order_id: serviceOrderId
        })
        .select()
        .single();

      if (nfseError) throw nfseError;

      const { data: configData, error: configError } = await supabase
        .from("nfse_sp_config")
        .select("id")
        .limit(1)
        .single();

      if (configError) {
        console.error("Erro ao buscar configuração:", configError);
        throw configError;
      }

      const { error: updateError } = await supabase
        .from("nfse_sp_config")
        .update({ 
          ultima_rps_numero: parseInt(data.numero_rps || "0", 10)
        })
        .eq('id', configData.id);

      if (updateError) {
        console.error("Erro ao atualizar número do RPS:", updateError);
      }

      toast({
        title: "NFS-e salva com sucesso",
        description: "A nota fiscal foi salva e pode ser enviada posteriormente"
      });
      
      navigate("/dashboard/nfse");
    } catch (error: any) {
      console.error("Error saving NFSe:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar NFS-e",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova NFS-e</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <NFSeForm
          onSubmit={handleSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
          initialData={formData}
          submitButtonText="Salvar"
        />
      </CardContent>
    </Card>
  );
};
