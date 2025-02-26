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
import { Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ColumnSelect } from "@/components/ui/column-select";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  codigo_servico_sp: string | null;
  codigo_cnae: string | null;
  aliquota_iss: number | null;
  item_lista_servico: string | null;
  discriminacao_padrao: string | null;
  iss_retido: boolean;
  exigibilidade_iss: string | null;
  codigo_tributacao_municipio: string | null;
  codigo_municipio_prestacao: string | null;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  codigo_servico_sp: string;
  codigo_cnae: string;
  aliquota_iss: number;
  item_lista_servico: string;
  discriminacao_padrao: string;
  iss_retido: boolean;
  exigibilidade_iss: string;
  codigo_tributacao_municipio: string;
  codigo_municipio_prestacao: string;
}

const defaultFormData: ProductFormData = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  codigo_servico_sp: "",
  codigo_cnae: "",
  aliquota_iss: 0,
  item_lista_servico: "",
  discriminacao_padrao: "",
  iss_retido: false,
  exigibilidade_iss: "1",
  codigo_tributacao_municipio: "",
  codigo_municipio_prestacao: "",
};

const PRODUCT_COLUMNS = [
  { name: "name", label: "Nome" },
  { name: "description", label: "Descrição" },
  { name: "price", label: "Preço" },
  { name: "stock", label: "Estoque" },
  { name: "codigo_servico_sp", label: "Código Serviço SP" },
  { name: "codigo_cnae", label: "Código CNAE" },
  { name: "aliquota_iss", label: "Alíquota ISS" },
  { name: "item_lista_servico", label: "Item Lista Serviço" },
  { name: "discriminacao_padrao", label: "Discriminação Padrão" },
  { name: "iss_retido", label: "ISS Retido" },
  { name: "exigibilidade_iss", label: "Exigibilidade ISS" },
  { name: "codigo_tributacao_municipio", label: "Cód. Tributação Municipal" },
  { name: "codigo_municipio_prestacao", label: "Cód. Município Prestação" },
];

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "description",
    "price",
    "stock",
    "codigo_servico_sp",
    "aliquota_iss",
    "iss_retido",
  ]);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${searchTerm}%`);

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Produto excluído com sucesso",
      });
      
      fetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir produto",
        description: error.message,
      });
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock || 0,
      codigo_servico_sp: product.codigo_servico_sp || "",
      codigo_cnae: product.codigo_cnae || "",
      aliquota_iss: product.aliquota_iss || 0,
      item_lista_servico: product.item_lista_servico || "",
      discriminacao_padrao: product.discriminacao_padrao || "",
      iss_retido: product.iss_retido || false,
      exigibilidade_iss: product.exigibilidade_iss || "1",
      codigo_tributacao_municipio: product.codigo_tributacao_municipio || "",
      codigo_municipio_prestacao: product.codigo_municipio_prestacao || "",
    });
    setEditingId(product.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Produto atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("products")
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Produto criado com sucesso",
        });
      }

      setDialogOpen(false);
      setFormData(defaultFormData);
      setEditingId(null);
      fetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingId ? "Erro ao atualizar produto" : "Erro ao criar produto",
        description: error.message,
      });
    }
  };

  const handleNewProduct = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" || name === "aliquota_iss" 
        ? Number(value) 
        : value,
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Produtos</h2>
        <div className="flex items-center gap-2">
          <ColumnSelect
            columns={PRODUCT_COLUMNS}
            selectedColumns={visibleColumns}
            onChange={setVisibleColumns}
          />
          <Button onClick={handleNewProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Buscar produtos..."
          className="max-w-sm"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {PRODUCT_COLUMNS.filter(col => visibleColumns.includes(col.name)).map((column) => (
                <TableHead key={column.name}>{column.label}</TableHead>
              ))}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  {visibleColumns.map((columnName) => (
                    <TableCell key={columnName}>
                      {columnName === "price" ? (
                        product[columnName].toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })
                      ) : columnName === "iss_retido" ? (
                        product[columnName] ? "Sim" : "Não"
                      ) : columnName === "aliquota_iss" ? (
                        `${product[columnName]}%`
                      ) : (
                        product[columnName]
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_servico_sp">Código do Serviço (SP)</Label>
                <Input
                  id="codigo_servico_sp"
                  name="codigo_servico_sp"
                  value={formData.codigo_servico_sp}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_cnae">Código CNAE</Label>
                <Input
                  id="codigo_cnae"
                  name="codigo_cnae"
                  value={formData.codigo_cnae}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliquota_iss">Alíquota ISS (%)</Label>
                <Input
                  id="aliquota_iss"
                  name="aliquota_iss"
                  type="number"
                  step="0.01"
                  value={formData.aliquota_iss}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_lista_servico">Item Lista de Serviço</Label>
                <Input
                  id="item_lista_servico"
                  name="item_lista_servico"
                  value={formData.item_lista_servico}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_tributacao_municipio">Código Tributação Municipal</Label>
                <Input
                  id="codigo_tributacao_municipio"
                  name="codigo_tributacao_municipio"
                  value={formData.codigo_tributacao_municipio}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_municipio_prestacao">Código Município Prestação</Label>
                <Input
                  id="codigo_municipio_prestacao"
                  name="codigo_municipio_prestacao"
                  value={formData.codigo_municipio_prestacao}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exigibilidade_iss">Exigibilidade do ISS</Label>
                <Select
                  value={formData.exigibilidade_iss}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, exigibilidade_iss: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a exigibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Exigível</SelectItem>
                    <SelectItem value="2">2 - Não incidência</SelectItem>
                    <SelectItem value="3">3 - Isenção</SelectItem>
                    <SelectItem value="4">4 - Exportação</SelectItem>
                    <SelectItem value="5">5 - Imunidade</SelectItem>
                    <SelectItem value="6">6 - Exigibilidade Suspensa por Decisão Judicial</SelectItem>
                    <SelectItem value="7">7 - Exigibilidade Suspensa por Processo Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-center">
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discriminacao_padrao">Discriminação Padrão do Serviço</Label>
              <Textarea
                id="discriminacao_padrao"
                name="discriminacao_padrao"
                value={formData.discriminacao_padrao}
                onChange={handleInputChange}
                rows={3}
                placeholder="Descrição detalhada do serviço para a NFS-e"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
