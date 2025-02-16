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
import { Loader2, Search, Plus, Pencil, Save, X, Trash2, Download, Upload, ArrowUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface ImportPreviewData extends ServiceCodeFormData {
  isValid: boolean;
  error?: string;
}

type SortOrder = 'asc' | 'desc';
type SortField = 'code' | 'description' | 'aliquota_iss';

export function ServiceCodesSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [serviceCodes, setServiceCodes] = useState<ServiceCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCode, setSelectedCode] = useState<ServiceCode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<ImportPreviewData[]>([]);
  const [codeToDelete, setCodeToDelete] = useState<ServiceCode | null>(null);
  const [formData, setFormData] = useState<ServiceCodeFormData>({
    code: "",
    description: "",
    aliquota_iss: 0,
  });
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    loadServiceCodes();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nfse_service_codes'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          loadServiceCodes(); // Reload the data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleDelete = async (code: ServiceCode) => {
    setCodeToDelete(code);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!codeToDelete) return;

    try {
      const { error } = await supabase
        .from("nfse_service_codes")
        .delete()
        .eq("id", codeToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Código de serviço excluído com sucesso",
      });

      setIsDeleteDialogOpen(false);
      setCodeToDelete(null);
      loadServiceCodes();
    } catch (error: any) {
      console.error("Erro ao excluir código:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o código de serviço",
      });
    }
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

  const validateServiceCode = (code: string, description: string, aliquota: number): ImportPreviewData => {
    const data: ImportPreviewData = {
      code,
      description,
      aliquota_iss: aliquota,
      isValid: true
    };

    if (!code.trim()) {
      data.isValid = false;
      data.error = "Código é obrigatório";
      return data;
    }

    if (!description.trim()) {
      data.isValid = false;
      data.error = "Descrição é obrigatória";
      return data;
    }

    if (isNaN(aliquota) || aliquota < 0 || aliquota > 100) {
      data.isValid = false;
      data.error = "Alíquota ISS deve ser um número entre 0 e 100";
      return data;
    }

    return data;
  };

  const handleExport = () => {
    const csvContent = [
      ["Código", "Descrição", "Alíquota ISS"],
      ...serviceCodes.map(code => [
        code.code,
        code.description,
        code.aliquota_iss.toString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "codigos-servico.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split("\n").slice(1); // Skip header row
        const preview = rows.map(row => {
          const [code, description, aliquota_iss] = row.split(",");
          return validateServiceCode(
            code.trim(),
            description.trim(),
            parseFloat(aliquota_iss)
          );
        });

        setImportPreviewData(preview);
        setIsImportPreviewOpen(true);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao ler o arquivo CSV",
        });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    try {
      const validCodes = importPreviewData.filter(code => code.isValid);
      if (validCodes.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Nenhum código válido para importar",
        });
        return;
      }

      const { error } = await supabase
        .from("nfse_service_codes")
        .insert(validCodes.map(code => ({
          code: code.code,
          description: code.description,
          aliquota_iss: code.aliquota_iss,
          active: true
        })));

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${validCodes.length} códigos de serviço importados com sucesso`,
      });

      setIsImportPreviewOpen(false);
      setImportPreviewData([]);
      loadServiceCodes();
    } catch (error: any) {
      console.error("Erro ao importar códigos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao importar códigos de serviço",
      });
    }
  };

  const filteredCodes = serviceCodes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSortedAndFilteredCodes = () => {
    let filtered = serviceCodes.filter(
      (code) =>
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'code') {
        return a.code.localeCompare(b.code) * multiplier;
      }
      if (sortField === 'description') {
        return a.description.localeCompare(b.description) * multiplier;
      }
      if (sortField === 'aliquota_iss') {
        return (a.aliquota_iss - b.aliquota_iss) * multiplier;
      }
      return 0;
    });
  };

  const renderSortIcon = (field: SortField) => {
    return (
      <ArrowUpDown 
        className={`h-4 w-4 inline ml-1 ${sortField === field ? 'opacity-100' : 'opacity-50'}`}
      />
    );
  };

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
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="import-csv"
              />
              <Button onClick={() => document.getElementById("import-csv")?.click()} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
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
                  <TableHead 
                    className="w-[100px] cursor-pointer"
                    onClick={() => handleSort('code')}
                  >
                    Código {renderSortIcon('code')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('description')}
                  >
                    Descrição {renderSortIcon('description')}
                  </TableHead>
                  <TableHead 
                    className="w-[120px] text-right cursor-pointer"
                    onClick={() => handleSort('aliquota_iss')}
                  >
                    Alíquota ISS {renderSortIcon('aliquota_iss')}
                  </TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
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
                ) : getSortedAndFilteredCodes().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Nenhum código de serviço encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  getSortedAndFilteredCodes().map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell className="text-right">
                        {code.aliquota_iss?.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(code)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(code)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir código de serviço</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o código de serviço{" "}
                <span className="font-medium">{codeToDelete?.code}</span>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Prévia da Importação</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[120px] text-right">Alíquota ISS</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreviewData.map((item, index) => (
                    <TableRow key={index} className={item.isValid ? "" : "bg-destructive/10"}>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.aliquota_iss}%</TableCell>
                      <TableCell>
                        {item.isValid ? (
                          <span className="text-green-600">Válido</span>
                        ) : (
                          <span className="text-destructive text-sm">{item.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportPreviewOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={confirmImport}>
                <Upload className="h-4 w-4 mr-2" />
                Confirmar Importação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
