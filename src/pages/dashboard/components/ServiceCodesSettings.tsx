
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
import { Loader2, Search } from "lucide-react";

interface ServiceCode {
  id: string;
  code: string;
  description: string;
  aliquota_iss: number;
  active: boolean;
}

export function ServiceCodesSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [serviceCodes, setServiceCodes] = useState<ServiceCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCode, setSelectedCode] = useState<ServiceCode | null>(null);

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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[120px] text-right">Alíquota ISS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
