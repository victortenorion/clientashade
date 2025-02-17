import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { NFCeConfig, NFSeConfig, FiscalConfig, ValidateCertificateResponse } from "../types/config.types";

interface SEFAZTabProps {
  nfceConfig: NFCeConfig;
  nfseConfig: NFSeConfig;
  fiscalConfig: FiscalConfig;
  setNfceConfig: (config: NFCeConfig) => void;
  setNfseConfig: (config: NFSeConfig) => void;
  setFiscalConfig: (config: FiscalConfig) => void;
  handleSaveAllConfigs: () => void;
}

export const SEFAZTab: React.FC<SEFAZTabProps> = ({
  nfceConfig,
  nfseConfig,
  fiscalConfig,
  setNfceConfig,
  setNfseConfig,
  setFiscalConfig,
  handleSaveAllConfigs,
}) => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [selectedTab, setSelectedTab] = useState("nfse");
  const [isSaving, setIsSaving] = useState(false);
  const [certificateFile, setCertificateFile] = useState<string | null>(null);

  useEffect(() => {
    loadCertificate();
  }, [selectedTab]);

  const loadCertificate = async () => {
    try {
      const { data: certificate, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('type', selectedTab)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (certificate) {
        if (selectedTab === 'nfse') {
          setNfseConfig({
            ...nfseConfig,
            certificado_digital: certificate.certificate_data,
            senha_certificado: certificate.certificate_password || '',
            certificado_valido: certificate.is_valid,
            certificado_validade: certificate.valid_until
          });
          setCertificateFile(certificate.certificate_data);
        } else {
          setNfceConfig({
            ...nfceConfig,
            certificado_digital: certificate.certificate_data,
            senha_certificado: certificate.certificate_password || '',
            certificado_valido: certificate.is_valid,
            certificado_validade: certificate.valid_until
          });
          setCertificateFile(certificate.certificate_data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar certificado:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar certificado do banco de dados",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/x-pkcs12' && !file.name.endsWith('.pfx')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de certificado digital válido (.pfx)",
        variant: "destructive"
      });
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64Data = reader.result.includes('base64,') 
              ? reader.result.split('base64,')[1]
              : reader.result;
            resolve(base64Data);
          } else {
            reject(new Error('Resultado da leitura do arquivo inválido'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      console.log("Tamanho do certificado em base64:", base64.length);
      setCertificateFile(base64);

      if (selectedTab === 'nfse') {
        setNfseConfig({
          ...nfseConfig,
          certificado_digital: base64,
          certificado_valido: false,
          certificado_validade: undefined
        });
      } else {
        setNfceConfig({
          ...nfceConfig,
          certificado_digital: base64,
          certificado_valido: false,
          certificado_validade: undefined
        });
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo do certificado",
        variant: "destructive"
      });
    }
  };

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaSenha = e.target.value;
    if (selectedTab === 'nfse') {
      setNfseConfig({
        ...nfseConfig,
        senha_certificado: novaSenha,
        certificado_valido: false,
        certificado_validade: undefined
      });
    } else {
      setNfceConfig({
        ...nfceConfig,
        senha_certificado: novaSenha,
        certificado_valido: false,
        certificado_validade: undefined
      });
    }
  };

  const handleValidateCertificate = async () => {
    setIsValidating(true);
    const currentConfig = selectedTab === 'nfse' ? nfseConfig : nfceConfig;
    
    try {
      console.log("Iniciando validação do certificado...");
      console.log("Tamanho do certificado em base64:", certificateFile?.length || 0);
      
      if (!certificateFile || !currentConfig.senha_certificado) {
        throw new Error("Certificado e senha são obrigatórios");
      }

      console.log("Enviando certificado para validação...");
      console.log("Senha sendo enviada:", currentConfig.senha_certificado);

      const { data, error } = await supabase.functions.invoke<ValidateCertificateResponse>('validate-certificate', {
        body: {
          certificado: certificateFile,
          senha: currentConfig.senha_certificado,
        }
      });

      console.log("Resposta completa:", { data, error });

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Resposta inválida do servidor");

      console.log("Resposta da validação:", data);

      if (data.success) {
        const { data: existingCert, error: queryError } = await supabase
          .from('certificates')
          .select('id, created_at')
          .eq('type', selectedTab)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (queryError) {
          console.error('Erro ao verificar certificado existente:', queryError);
          throw new Error("Erro ao verificar certificado existente");
        }

        const { error: saveError } = await supabase
          .from('certificates')
          .upsert({
            id: existingCert?.id,
            type: selectedTab,
            certificate_data: certificateFile,
            certificate_password: currentConfig.senha_certificado,
            valid_until: data.validade || null,
            is_valid: true,
            created_at: existingCert ? existingCert.created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (saveError) {
          console.error('Erro ao salvar certificado:', saveError);
          throw new Error("Erro ao salvar certificado no banco de dados");
        }

        const updatedConfig = {
          ...currentConfig,
          certificado_digital: certificateFile,
          senha_certificado: currentConfig.senha_certificado,
          certificado_valido: true,
          certificado_validade: data.validade
        };

        if (selectedTab === 'nfse') {
          setNfseConfig(updatedConfig as NFSeConfig);
        } else {
          setNfceConfig(updatedConfig as NFCeConfig);
        }

        toast({
          title: "Sucesso",
          description: data.validade ? 
            `Certificado digital válido até ${new Date(data.validade).toLocaleDateString()}` :
            "Certificado digital válido",
        });
      } else {
        throw new Error(data.message || "Certificado inválido");
      }
    } catch (error: any) {
      console.error('Erro na validação:', error);
      
      try {
        const { data: existingCert } = await supabase
          .from('certificates')
          .select('id, created_at')
          .eq('type', selectedTab)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { error: saveError } = await supabase
          .from('certificates')
          .upsert({
            id: existingCert?.id,
            type: selectedTab,
            certificate_data: certificateFile,
            certificate_password: currentConfig.senha_certificado,
            is_valid: false,
            valid_until: null,
            created_at: existingCert ? existingCert.created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (saveError) {
          console.error('Erro ao atualizar status do certificado:', saveError);
        }
      } catch (dbError) {
        console.error('Erro ao atualizar status do certificado:', dbError);
      }

      const updatedConfig = {
        ...currentConfig,
        certificado_valido: false,
        certificado_validade: undefined
      };

      if (selectedTab === 'nfse') {
        setNfseConfig(updatedConfig as NFSeConfig);
      } else {
        setNfceConfig(updatedConfig as NFCeConfig);
      }

      toast({
        title: "Erro na validação",
        description: error.message || "Erro ao validar certificado digital",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nfse">NFS-e</TabsTrigger>
          <TabsTrigger value="nfce">NFC-e</TabsTrigger>
        </TabsList>

        <TabsContent value="nfse" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Certificado Digital</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Arquivo do Certificado (A1)</Label>
                    <Input
                      type="file"
                      accept=".pfx"
                      onChange={handleFileUpload}
                    />
                    {certificateFile && (
                      <p className="text-sm text-gray-500">
                        Certificado carregado
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Senha do Certificado</Label>
                    <Input
                      type="password"
                      value={selectedTab === 'nfse' ? nfseConfig.senha_certificado : nfceConfig.senha_certificado}
                      onChange={handleSenhaChange}
                    />
                  </div>

                  {certificateFile && (
                    <Button
                      onClick={handleValidateCertificate}
                      disabled={isValidating || !(selectedTab === 'nfse' ? nfseConfig.senha_certificado : nfceConfig.senha_certificado)}
                    >
                      {isValidating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (selectedTab === 'nfse' ? nfseConfig.certificado_valido : nfceConfig.certificado_valido) ? (
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      )}
                      Validar Certificado
                    </Button>
                  )}

                  {(selectedTab === 'nfse' ? nfseConfig.certificado_validade : nfceConfig.certificado_validade) && (
                    <p className="text-sm text-gray-500">
                      Válido até: {new Date(selectedTab === 'nfse' ? nfseConfig.certificado_validade! : nfceConfig.certificado_validade!).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações NFS-e São Paulo</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={nfseConfig.ambiente}
                      onValueChange={(value) =>
                        setNfseConfig({ ...nfseConfig, ambiente: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usuario_emissor" className="text-red-500 font-medium">Usuário Emissor *</Label>
                    <Input
                      id="usuario_emissor"
                      value={nfseConfig.usuario_emissor}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          usuario_emissor: e.target.value,
                        })
                      }
                      placeholder="Digite o usuário emissor"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha_emissor" className="text-red-500 font-medium">Senha Emissor *</Label>
                    <Input
                      id="senha_emissor"
                      type="password"
                      value={nfseConfig.senha_emissor}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          senha_emissor: e.target.value,
                        })
                      }
                      placeholder="Digite a senha do emissor"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Provedor</Label>
                    <Input
                      value={nfseConfig.url_provedor || ""}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          url_provedor: e.target.value,
                        })
                      }
                      placeholder="https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Código da Cidade de Prestação</Label>
                    <Input
                      value={nfseConfig.codigo_cidade_prestacao || ""}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          codigo_cidade_prestacao: e.target.value,
                        })
                      }
                      placeholder="3550308 (São Paulo)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número do Lote</Label>
                    <Input
                      type="number"
                      value={nfseConfig.numero_lote || 1}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          numero_lote: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Máximo de RPS por Lote</Label>
                    <Input
                      type="number"
                      value={nfseConfig.lote_envio_maximo || 50}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          lote_envio_maximo: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Versão do Schema</Label>
                    <Input
                      value={nfseConfig.versao_schema || "2.00"}
                      onChange={(e) =>
                        setNfseConfig({
                          ...nfseConfig,
                          versao_schema: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={nfseConfig.usar_certificado_gov || false}
                      onCheckedChange={(checked) =>
                        setNfseConfig({ ...nfseConfig, usar_certificado_gov: checked })
                      }
                    />
                    <Label>Usar Certificado e-CPF do Governo</Label>
                  </div>

                  {nfseConfig.usar_certificado_gov && (
                    <>
                      <div className="space-y-2">
                        <Label>Caminho do Certificado e-CPF</Label>
                        <Input
                          value={nfseConfig.caminho_certificado_gov || ""}
                          onChange={(e) =>
                            setNfseConfig({
                              ...nfseConfig,
                              caminho_certificado_gov: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Senha do Certificado e-CPF</Label>
                        <Input
                          type="password"
                          value={nfseConfig.senha_certificado_gov || ""}
                          onChange={(e) =>
                            setNfseConfig({
                              ...nfseConfig,
                              senha_certificado_gov: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-4">
                    <h4 className="font-semibold">Configurações de Proxy</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Host do Proxy</Label>
                        <Input
                          value={nfseConfig.proxy_host || ""}
                          onChange={(e) =>
                            setNfseConfig({
                              ...nfseConfig,
                              proxy_host: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Porta do Proxy</Label>
                        <Input
                          value={nfseConfig.proxy_porta || ""}
                          onChange={(e) =>
                            setNfseConfig({
                              ...nfseConfig,
                              proxy_porta: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Usuário do Proxy</Label>
                        <Input
                          value={nfseConfig.proxy_usuario || ""}
                          onChange={(e) =>
                            setNfseConfig({
                              ...nfseConfig,
                              proxy_usuario: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Senha do Proxy</Label>
                        <Input
                          type="password"
                          value={nfseConfig.proxy_senha || ""}
                          onChange={(e) =>
                            setNfseConfig({
                              ...nfseConfig,
                              proxy_senha: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfce" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações NFC-e</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={nfceConfig.ambiente}
                      onValueChange={(value) =>
                        setNfceConfig({ ...nfceConfig, ambiente: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Token IBPT</Label>
                    <Input
                      value={nfceConfig.token_ibpt}
                      onChange={(e) =>
                        setNfceConfig({ ...nfceConfig, token_ibpt: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CSC ID</Label>
                    <Input
                      value={nfceConfig.csc_id}
                      onChange={(e) =>
                        setNfceConfig({ ...nfceConfig, csc_id: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CSC Token</Label>
                    <Input
                      value={nfceConfig.csc_token}
                      onChange={(e) =>
                        setNfceConfig({ ...nfceConfig, csc_token: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button 
          onClick={handleSaveAllConfigs} 
          disabled={isSaving || !nfseConfig.usuario_emissor || !nfseConfig.senha_emissor}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};
