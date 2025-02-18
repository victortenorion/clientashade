
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export const NFSeSPSettingsTab = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    usuario_emissor: "",
    senha_emissor: "",
    ambiente: "homologacao",
    inscricao_municipal: "",
    codigo_servico_padrao: "",
    aliquota_servico: 0,
    versao_schema: "2.00",
    descricao_servico_padrao: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('nfse_sp_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar as configurações da NFS-e SP",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('nfse_sp_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações da NFS-e SP salvas com sucesso",
      });

      await loadSettings();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações da NFS-e SP",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações NFS-e São Paulo</h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Usuário Emissor</Label>
                <Input
                  value={settings.usuario_emissor}
                  onChange={(e) =>
                    setSettings({ ...settings, usuario_emissor: e.target.value })
                  }
                  placeholder="Usuário para emissão na prefeitura"
                />
              </div>

              <div className="space-y-2">
                <Label>Senha Emissor</Label>
                <Input
                  type="password"
                  value={settings.senha_emissor}
                  onChange={(e) =>
                    setSettings({ ...settings, senha_emissor: e.target.value })
                  }
                  placeholder="Senha para emissão na prefeitura"
                />
              </div>

              <div className="space-y-2">
                <Label>Inscrição Municipal</Label>
                <Input
                  value={settings.inscricao_municipal}
                  onChange={(e) =>
                    setSettings({ ...settings, inscricao_municipal: e.target.value })
                  }
                  placeholder="Inscrição Municipal"
                />
              </div>

              <div className="space-y-2">
                <Label>Código de Serviço Padrão</Label>
                <Input
                  value={settings.codigo_servico_padrao}
                  onChange={(e) =>
                    setSettings({ ...settings, codigo_servico_padrao: e.target.value })
                  }
                  placeholder="Código de serviço padrão"
                />
              </div>

              <div className="space-y-2">
                <Label>Alíquota de Serviço (%)</Label>
                <Input
                  type="number"
                  value={settings.aliquota_servico}
                  onChange={(e) =>
                    setSettings({ ...settings, aliquota_servico: parseFloat(e.target.value) })
                  }
                  placeholder="Ex: 5"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição de Serviço Padrão</Label>
                <Input
                  value={settings.descricao_servico_padrao}
                  onChange={(e) =>
                    setSettings({ ...settings, descricao_servico_padrao: e.target.value })
                  }
                  placeholder="Descrição padrão para os serviços"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Configurações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
