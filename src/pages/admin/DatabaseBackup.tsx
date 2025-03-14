
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Database, AlertTriangle, ShieldAlert } from "lucide-react";
import { generateDatabaseBackup, downloadSqlBackup } from "@/utils/databaseBackup";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        description: "Gerando backup do banco de dados...",
      });
      
      const sql = await generateDatabaseBackup();
      
      if (!sql || sql.trim() === '') {
        throw new Error("Não foi possível gerar o backup. Verifique as permissões do banco de dados.");
      }
      
      setBackupSql(sql);
      
      const url = downloadSqlBackup(sql);
      setDownloadUrl(url);
      
      toast({
        title: "Backup concluído",
        description: "O backup do banco de dados foi gerado com sucesso!",
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
            Backup do Banco de Dados
          </CardTitle>
          <CardDescription>
            Gere um backup completo do seu banco de dados em formato SQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ferramenta irá gerar um arquivo SQL contendo instruções para recriar todas as tabelas
              do seu banco de dados junto com seus dados. Esse backup pode ser importado em qualquer
              sistema compatível com PostgreSQL.
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
                    <li>Verifique se a chave de API do Supabase está correta</li>
                    <li>Certifique-se de que você está usando uma chave de serviço com permissões adequadas</li>
                    <li>Verifique a conexão com o banco de dados</li>
                    <li>Certifique-se de que você está logado como administrador</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <Alert variant="default" className="bg-muted">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Permissões necessárias</AlertTitle>
              <AlertDescription>
                Esta funcionalidade requer uma chave de serviço do Supabase com permissões completas ao banco de dados.
                Acesse seu dashboard do Supabase e verifique se a configuração está correta.
              </AlertDescription>
            </Alert>
            
            {backupSql && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Prévia do backup:</h3>
                <div className="bg-muted p-3 rounded-md max-h-60 overflow-auto">
                  <pre className="text-xs">{backupSql.slice(0, 1000)}...</pre>
                </div>
              </div>
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
                download={`db_backup_${new Date().toISOString().slice(0, 10)}.sql`}
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
