
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface NFSeSPSettings {
  id?: string;
  inscricao_municipal: string;
  codigo_regime_tributario: string;
  tipo_documento: string;
  usuario_emissor: string;
  senha_emissor: string;
  ambiente: string;
  versao_schema: string;
}

const NFSeSPConfig = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NFSeSPSettings>({
    inscricao_municipal: '',
    codigo_regime_tributario: '',
    tipo_documento: '',
    usuario_emissor: '',
    senha_emissor: '',
    ambiente: '',
    versao_schema: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log("Carregando configurações...");
      const { data, error } = await supabase
        .from('nfse_sp_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar:', error);
        throw error;
      }

      console.log("Dados carregados:", data);
      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar as configurações da NFSe SP",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log("Salvando configurações:", settings);
      const { error } = await supabase
        .from('nfse_sp_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar:', error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
      
      // Recarrega os dados após salvar
      await loadSettings();
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar as configurações",
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações NFSe SP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao_municipal"
                value={settings.inscricao_municipal}
                onChange={(e) => setSettings(prev => ({...prev, inscricao_municipal: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_regime_tributario">Código Regime Tributário</Label>
              <Input
                id="codigo_regime_tributario"
                value={settings.codigo_regime_tributario}
                onChange={(e) => setSettings(prev => ({...prev, codigo_regime_tributario: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_documento">Tipo Documento</Label>
              <Input
                id="tipo_documento"
                value={settings.tipo_documento}
                onChange={(e) => setSettings(prev => ({...prev, tipo_documento: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario_emissor">Usuário Emissor</Label>
              <Input
                id="usuario_emissor"
                value={settings.usuario_emissor}
                onChange={(e) => setSettings(prev => ({...prev, usuario_emissor: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha_emissor">Senha Emissor</Label>
              <Input
                id="senha_emissor"
                type="password"
                value={settings.senha_emissor}
                onChange={(e) => setSettings(prev => ({...prev, senha_emissor: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ambiente">Ambiente</Label>
              <Input
                id="ambiente"
                value={settings.ambiente}
                onChange={(e) => setSettings(prev => ({...prev, ambiente: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="versao_schema">Versão Schema</Label>
              <Input
                id="versao_schema"
                value={settings.versao_schema}
                onChange={(e) => setSettings(prev => ({...prev, versao_schema: e.target.value}))}
              />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4">
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NFSeSPConfig;
