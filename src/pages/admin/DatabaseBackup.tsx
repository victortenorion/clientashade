
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Database, AlertTriangle, ShieldAlert } from "lucide-react";
import { generateDatabaseBackup, downloadSqlBackup } from "@/utils/databaseBackup";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DatabaseBackup() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [backupSql, setBackupSql] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateBackup = async () => {
    try {
      setIsLoading(true);
      setBackupSql(null);
      setDownloadUrl(null);
      setError(null);
      
      toast({
        title: "Backup iniciado",
        description: "Gerando backup local do banco de dados...",
      });
      
      const sql = await generateDatabaseBackup();
      
      if (!sql || sql.trim() === '') {
        throw new Error("Não foi possível gerar o backup. Não foram encontrados dados para exportar.");
      }
      
      setBackupSql(sql);
      
      const url = downloadSqlBackup(sql);
      setDownloadUrl(url);
      
      toast({
        title: "Backup concluído",
        description: "O backup local do banco de dados foi gerado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar backup:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? String((error as any).message)
          : String(error);
          
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro no backup",
        description: `Ocorreu um erro ao gerar o backup: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Backup Local do Banco de Dados
          </CardTitle>
          <CardDescription>
            Gere um backup dos seus dados e estruturas em formato SQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ferramenta irá gerar um arquivo SQL contendo as estruturas e dados das suas principais tabelas.
              Este backup local funciona apenas com os dados que você tem acesso através do cliente
              autenticado e pode ser usado para referência ou importação em outro sistema.
            </p>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao gerar backup</AlertTitle>
                <AlertDescription>
                  {error}
                  <br />
                  <br />
                  <span className="font-semibold">Possíveis soluções:</span>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Certifique-se de que você está logado como administrador</li>
                    <li>Verifique se sua conexão com a internet está estável</li>
                    <li>Tente novamente mais tarde</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <Alert variant="default" className="bg-muted">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Informação importante</AlertTitle>
              <AlertDescription>
                Este é um backup local que contém apenas os dados que seu usuário pode acessar.
                Para um backup completo, recomendamos usar as ferramentas nativas do Supabase no dashboard.
              </AlertDescription>
            </Alert>
            
            {backupSql && (
              <Tabs defaultValue="structure" className="mt-4">
                <TabsList className="mb-2">
                  <TabsTrigger value="structure">Estruturas</TabsTrigger>
                  <TabsTrigger value="data">Dados</TabsTrigger>
                </TabsList>
                <TabsContent value="structure">
                  <h3 className="text-sm font-medium mb-2">Estruturas das tabelas:</h3>
                  <div className="bg-muted p-3 rounded-md max-h-60 overflow-auto">
                    <pre className="text-xs">{backupSql.split("-- ESTRUTURAS DAS TABELAS")[1].split("-- Dados para tabela")[0]}</pre>
                  </div>
                </TabsContent>
                <TabsContent value="data">
                  <h3 className="text-sm font-medium mb-2">Prévia dos dados:</h3>
                  <div className="bg-muted p-3 rounded-md max-h-60 overflow-auto">
                    <pre className="text-xs">{backupSql.includes("-- Dados para tabela") ? 
                      backupSql.split("-- Dados para tabela")[1].slice(0, 1000) + "..." : 
                      "Nenhum dado disponível"}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-4">
          <Button 
            onClick={handleGenerateBackup} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando backup...
              </>
            ) : (
              <>Gerar Backup SQL</>
            )}
          </Button>
          
          {downloadUrl && (
            <Button 
              variant="outline" 
              asChild
            >
              <a 
                href={downloadUrl} 
                download={`db_backup_estruturas_e_dados_${new Date().toISOString().slice(0, 10)}.sql`}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar SQL
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
