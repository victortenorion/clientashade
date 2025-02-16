
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus, Pencil, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ServiceCode {
  id: string;
  code: string;
  description: string;
  aliquota_iss: number;
  active: boolean;
}

interface ServiceCodeFormData {
  code: string;
  description: string;
  aliquota_iss: number;
}

export function ServiceCodesSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [serviceCodes, setServiceCodes] = useState<ServiceCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCode, setSelectedCode] = useState<ServiceCode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceCodeFormData>({
    code: "",
    description: "",
    aliquota_iss: 0,
  });

  useEffect(() => {
    loadServiceCodes();
  }, []);

  const loadServiceCodes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("nfse_service_codes")
        .select("*")
        .order("code");

      if (error) throw error;

      setServiceCodes(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar códigos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os códigos de serviço",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (code?: ServiceCode) => {
    if (code) {
      setFormData({
        code: code.code,
        description: code.description,
        aliquota_iss: code.aliquota_iss,
      });
      setSelectedCode(code);
    } else {
      setFormData({
        code: "",
        description: "",
        aliquota_iss: 0,
      });
      setSelectedCode(null);
    }
    setIsDialogOpen(true);
  };

  const handleSaveServiceCode = async () => {
    try {
      if (!formData.code || !formData.description) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
        });
        return;
      }

      if (selectedCode) {
        // Atualizar código existente
        const { error } = await supabase
          .from("nfse_service_codes")
          .update({
            code: formData.code,
            description: formData.description,
            aliquota_iss: formData.aliquota_iss,
          })
          .eq("id", selectedCode.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Código de serviço atualizado com sucesso",
        });
      } else {
        // Criar novo código
        const { error } = await supabase.from("nfse_service_codes").insert([
          {
            code: formData.code,
            description: formData.description,
            aliquota_iss: formData.aliquota_iss,
            active: true,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Código de serviço criado com sucesso",
        });
      }

      setIsDialogOpen(false);
      loadServiceCodes();
    } catch (error: any) {
      console.error("Erro ao salvar código:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o código de serviço",
      });
    }
  };

  const filteredCodes = serviceCodes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Códigos de Serviço</CardTitle>
        <CardDescription>
          Gerencie os códigos de serviço da LC 116 utilizados nas notas fiscais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar códigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => handleOpenDialog()} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Novo Código
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[120px] text-right">Alíquota ISS</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Nenhum código de serviço encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell className="text-right">
                        {code.aliquota_iss?.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(code)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCode ? "Editar Código de Serviço" : "Novo Código de Serviço"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aliquota">Alíquota ISS (%)</Label>
                <Input
                  id="aliquota"
                  type="number"
                  step="0.01"
                  value={formData.aliquota_iss}
                  onChange={(e) =>
                    setFormData({ ...formData, aliquota_iss: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveServiceCode}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
