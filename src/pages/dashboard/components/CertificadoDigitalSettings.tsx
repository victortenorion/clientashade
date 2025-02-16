
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CertificateInfo {
  validade?: string;
  status: "válido" | "expirado" | "não encontrado";
}

export function CertificadoDigitalSettings() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [certificatePassword, setCertificatePassword] = useState("");
  const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    try {
      if (!selectedFile) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Por favor, selecione um arquivo de certificado",
        });
        return;
      }

      if (!certificatePassword) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Por favor, informe a senha do certificado",
        });
        return;
      }

      setIsUploading(true);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result?.toString().split(",")[1];
        
        if (!base64String) {
          throw new Error("Erro ao ler o arquivo");
        }

        // Validate certificate
        const { data, error } = await supabase.functions.invoke("validate-certificate", {
          body: {
            certificateData: base64String,
            password: certificatePassword,
          },
        });

        if (error) throw error;

        if (!data.success) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: data.message || "Erro ao validar o certificado",
          });
          return;
        }

        // First, try inserting without the select
        const { error: insertError } = await supabase
          .from("certificates")
          .insert({
            certificate_data: base64String,
            certificate_password: certificatePassword,
            valid_until: data.info?.validoAte,
            valid_from: data.info?.validoDe,
            issuer: JSON.stringify(data.info?.emissor),
            subject: JSON.stringify(data.info?.subject),
            type: 'A1',
            is_valid: true
          });

        if (insertError) {
          console.error('Erro ao salvar certificado:', insertError);
          throw insertError;
        }

        // Then fetch the latest certificate
        const { data: latestCert, error: fetchError } = await supabase
          .from("certificates")
          .select()
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          console.error('Erro ao buscar certificado:', fetchError);
          throw fetchError;
        }

        console.log('Certificado salvo com sucesso:', latestCert);

        setCertificateInfo({
          validade: data.info?.validoAte,
          status: new Date(data.info?.validoAte) > new Date() ? "válido" : "expirado",
        });

        toast({
          title: "Sucesso",
          description: "Certificado digital validado e salvo com sucesso",
        });

        // Clear form
        setSelectedFile(null);
        setCertificatePassword("");
        const fileInput = document.getElementById('certificate') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      console.error("Erro ao processar certificado:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao processar o certificado",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificado Digital</CardTitle>
        <CardDescription>
          Configure o certificado digital A1 para comunicação com a SEFAZ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="certificate">Arquivo do Certificado</Label>
            <Input
              id="certificate"
              type="file"
              accept=".pfx,.p12"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">Senha do Certificado</Label>
            <Input
              id="password"
              type="password"
              value={certificatePassword}
              onChange={(e) => setCertificatePassword(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {certificateInfo && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Status do Certificado</AlertTitle>
              <AlertDescription>
                {certificateInfo.status === "válido" ? (
                  <>
                    Certificado válido até {new Date(certificateInfo.validade!).toLocaleDateString()}
                  </>
                ) : (
                  <>
                    Certificado {certificateInfo.status}
                    {certificateInfo.validade && 
                      ` - Expirou em ${new Date(certificateInfo.validade).toLocaleDateString()}`
                    }
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !certificatePassword}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Certificado
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
