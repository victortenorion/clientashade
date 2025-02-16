import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Download, Upload } from "lucide-react";
import { ServiceCode, ServiceCodeFormData, ImportPreviewData, SortField, SortOrder, PaginationState } from "./service-codes/types";
import { ServiceCodeForm } from "./service-codes/ServiceCodeForm";
import { DeleteServiceCodeDialog } from "./service-codes/DeleteServiceCodeDialog";
import { ImportPreviewDialog } from "./service-codes/ImportPreviewDialog";
import { ServiceCodesTable } from "./service-codes/ServiceCodesTable";
import { ServiceCodesFilters } from "./service-codes/ServiceCodesFilters";
import { FilterState } from "./service-codes/types";

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
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    status: "all",
    aliquotaRange: {
      min: '',
      max: '',
    },
  });

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
      let query = supabase
        .from("nfse_service_codes")
        .select("*", { count: 'exact' })
        .range(
          (pagination.page - 1) * pagination.pageSize,
          pagination.page * pagination.pageSize - 1
        );

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`code.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.status !== 'all') {
        query = query.eq('active', filters.status === 'active');
      }

      if (filters.aliquotaRange.min !== '') {
        query = query.gte('aliquota_iss', filters.aliquotaRange.min);
      }

      if (filters.aliquotaRange.max !== '') {
        query = query.lte('aliquota_iss', filters.aliquotaRange.max);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setServiceCodes(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
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

  useEffect(() => {
    loadServiceCodes();
  }, [pagination.page, pagination.pageSize, filters]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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
          <ServiceCodesFilters 
            filters={filters}
            onFilterChange={setFilters}
          />

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

          <ServiceCodesTable
            isLoading={isLoading}
            codes={getSortedAndFilteredCodes()}
            sortField={sortField}
            onSort={handleSort}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />

          <ServiceCodeForm
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSave={handleSaveServiceCode}
            formData={formData}
            setFormData={setFormData}
            selectedCode={selectedCode}
          />

          <DeleteServiceCodeDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={confirmDelete}
            codeToDelete={codeToDelete}
          />

          <ImportPreviewDialog
            isOpen={isImportPreviewOpen}
            onClose={() => setIsImportPreviewOpen(false)}
            onConfirm={confirmImport}
            importPreviewData={importPreviewData}
          />
        </div>
      </CardContent>
    </Card>
  );
}
