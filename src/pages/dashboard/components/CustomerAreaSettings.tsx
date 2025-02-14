
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CustomerAreaSettings, CustomerAreaSettingsFormData } from "../types/customer-area.types";

export const CustomerAreaSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<CustomerAreaSettingsFormData>({
    title: "Área do Cliente",
    description: "",
    logo_url: "",
    primary_color: "#000000",
    secondary_color: "#ffffff"
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: storeData, error: storeError } = await supabase
        .from("user_stores")
        .select("store_id")
        .maybeSingle();

      if (storeError) throw storeError;

      if (storeData?.store_id) {
        const { data, error } = await supabase
          .from("customer_area_settings")
          .select("*")
          .eq("store_id", storeData.store_id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setSettings({
            title: data.title,
            description: data.description || "",
            logo_url: data.logo_url || "",
            primary_color: data.primary_color,
            secondary_color: data.secondary_color
          });
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { data: storeData, error: storeError } = await supabase
        .from("user_stores")
        .select("store_id")
        .maybeSingle();

      if (storeError) throw storeError;
      if (!storeData?.store_id) {
        throw new Error("Nenhuma loja encontrada para o usuário");
      }

      const { data, error } = await supabase
        .from("customer_area_settings")
        .upsert({
          store_id: storeData.store_id,
          ...settings
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações da área do cliente foram atualizadas com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: keyof CustomerAreaSettingsFormData, value: string) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Área do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">URL do Logo</Label>
            <Input
              id="logo_url"
              type="url"
              value={settings.logo_url}
              onChange={(e) => handleChange("logo_url", e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleChange("primary_color", e.target.value)}
                  className="w-16"
                />
                <Input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => handleChange("primary_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => handleChange("secondary_color", e.target.value)}
                  className="w-16"
                />
                <Input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => handleChange("secondary_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </form>
  );
};
