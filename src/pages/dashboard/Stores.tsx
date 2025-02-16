
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Store } from "./types/client.types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const defaultFormData = {
  name: "",
  inscricao_municipal: "",
  tipo_documento: "CNPJ",
  documento: "",
  regime_tributario: "",
  codigo_servico_padrao: "",
  cnae: "",
  codigo_municipio: "",
  iss_retido: false,
  aliquota_iss: 0,
  incentivador_cultural: false,
};

const Stores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const { toast } = useToast();

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      if (error) throw error;

      setStores(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar lojas",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStore) {
        const { error } = await supabase
          .from("stores")
          .update({ ...formData })
          .eq("id", editingStore.id);

        if (error) throw error;

        toast({
          title: "Loja atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("stores")
          .insert([{ ...formData }]);

        if (error) throw error;

        toast({
          title: "Loja criada com sucesso",
        });
      }

      setDialogOpen(false);
      setFormData(defaultFormData);
      setEditingStore(null);
      fetchStores();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar loja",
        description: error.message,
      });
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      inscricao_municipal: store.inscricao_municipal || "",
      tipo_documento: store.tipo_documento || "CNPJ",
      documento: store.documento || "",
      regime_tributario: store.regime_tributario || "",
      codigo_servico_padrao: store.codigo_servico_padrao || "",
      cnae: store.cnae || "",
      codigo_municipio: store.codigo_municipio || "",
      iss_retido: store.iss_retido || false,
      aliquota_iss: store.aliquota_iss || 0,
      incentivador_cultural: store.incentivador_cultural || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!storeToDelete) return;

    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeToDelete);

      if (error) throw error;

      toast({
        title: "Loja excluída com sucesso",
      });

      setStoreToDelete(null);
      setDeleteDialogOpen(false);
      fetchStores();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir loja",
        description: error.message,
      });
    }
  };

  const handleViewDetails = (store: Store) => {
    setSelectedStore(store);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Lojas</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Loja
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Inscrição Municipal</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>CNAE</TableHead>
              <TableHead className="w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.id}>
                <TableCell>{store.name}</TableCell>
                <TableCell>{store.inscricao_municipal || "-"}</TableCell>
                <TableCell>
                  {store.tipo_documento}: {store.documento || "-"}
                </TableCell>
                <TableCell>{store.cnae || "-"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetails(store)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(store)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setStoreToDelete(store.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {stores.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhuma loja cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStore ? "Editar Loja" : "Nova Loja"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                <Input
                  id="inscricao_municipal"
                  value={formData.inscricao_municipal}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, inscricao_municipal: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_documento">Tipo Documento</Label>
                <select
                  id="tipo_documento"
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  value={formData.tipo_documento}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tipo_documento: e.target.value }))
                  }
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="CPF">CPF</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, documento: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regime_tributario">Regime Tributário</Label>
                <select
                  id="regime_tributario"
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  value={formData.regime_tributario}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, regime_tributario: e.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  <option value="1">Simples Nacional</option>
                  <option value="2">Simples Nacional – excesso de sublimite de receita bruta</option>
                  <option value="3">Regime Normal</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_servico_padrao">Código Serviço Padrão</Label>
                <Input
                  id="codigo_servico_padrao"
                  value={formData.codigo_servico_padrao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, codigo_servico_padrao: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnae">CNAE</Label>
                <Input
                  id="cnae"
                  value={formData.cnae}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cnae: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_municipio">Código do Município</Label>
                <Input
                  id="codigo_municipio"
                  value={formData.codigo_municipio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, codigo_municipio: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliquota_iss">Alíquota ISS (%)</Label>
                <Input
                  id="aliquota_iss"
                  type="number"
                  step="0.01"
                  value={formData.aliquota_iss}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, aliquota_iss: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="iss_retido"
                  checked={formData.iss_retido}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, iss_retido: checked }))
                  }
                />
                <Label htmlFor="iss_retido">ISS Retido</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="incentivador_cultural"
                  checked={formData.incentivador_cultural}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, incentivador_cultural: checked }))
                  }
                />
                <Label htmlFor="incentivador_cultural">Incentivador Cultural</Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setFormData(defaultFormData);
                  setEditingStore(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Loja</DialogTitle>
          </DialogHeader>
          {selectedStore && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <p className="text-sm text-gray-600">{selectedStore.name}</p>
              </div>
              <div>
                <Label>Inscrição Municipal</Label>
                <p className="text-sm text-gray-600">{selectedStore.inscricao_municipal || '-'}</p>
              </div>
              <div>
                <Label>Documento</Label>
                <p className="text-sm text-gray-600">
                  {selectedStore.tipo_documento}: {selectedStore.documento || '-'}
                </p>
              </div>
              <div>
                <Label>Regime Tributário</Label>
                <p className="text-sm text-gray-600">{selectedStore.regime_tributario || '-'}</p>
              </div>
              <div>
                <Label>Código Serviço Padrão</Label>
                <p className="text-sm text-gray-600">{selectedStore.codigo_servico_padrao || '-'}</p>
              </div>
              <div>
                <Label>CNAE</Label>
                <p className="text-sm text-gray-600">{selectedStore.cnae || '-'}</p>
              </div>
              <div>
                <Label>Código do Município</Label>
                <p className="text-sm text-gray-600">{selectedStore.codigo_municipio || '-'}</p>
              </div>
              <div>
                <Label>Alíquota ISS</Label>
                <p className="text-sm text-gray-600">
                  {selectedStore.aliquota_iss ? `${selectedStore.aliquota_iss}%` : '-'}
                </p>
              </div>
              <div>
                <Label>ISS Retido</Label>
                <p className="text-sm text-gray-600">
                  {selectedStore.iss_retido ? 'Sim' : 'Não'}
                </p>
              </div>
              <div>
                <Label>Incentivador Cultural</Label>
                <p className="text-sm text-gray-600">
                  {selectedStore.incentivador_cultural ? 'Sim' : 'Não'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Loja</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta loja? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Stores;
