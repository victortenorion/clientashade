
import { supabase } from "@/integrations/supabase/client";

/**
 * Função para obter um backup das tabelas do banco de dados em formato SQL
 * @returns Promise com as queries SQL para recriação das tabelas
 */
export async function generateDatabaseBackup(): Promise<string> {
  try {
    console.log("Iniciando backup local do banco de dados...");
    
    // Verificar se o cliente está autenticado
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error("Usuário não autenticado. Faça login novamente.");
    }
    
    // Obter lista de tabelas dinamicamente
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error("Erro ao obter lista de tabelas:", tablesError);
      throw tablesError;
    }
    
    if (!tablesData || tablesData.length === 0) {
      throw new Error("Não foi possível obter a lista de tabelas do banco de dados.");
    }
    
    // Extrair nomes das tabelas
    const tables = tablesData.map(t => t.tablename);
    
    console.log(`Gerando backup para ${tables.length} tabelas`);
    
    let sqlQueries = "-- Backup gerado em " + new Date().toISOString() + "\n\n";
    
    // Para cada tabela, obter seus dados
    for (const tableName of tables) {
      try {
        console.log(`Processando tabela: ${tableName}`);
        
        // Obter os 1000 primeiros registros de cada tabela
        // Usando type assertion para evitar erros de tipo
        const { data: tableData, error: dataError } = await supabase
          .from(tableName as any)
          .select('*')
          .limit(1000);
        
        if (dataError) {
          console.error(`Erro ao obter dados da tabela ${tableName}:`, dataError);
          sqlQueries += `-- Não foi possível obter os dados da tabela: ${tableName}\n`;
          sqlQueries += `-- Erro: ${dataError.message}\n\n`;
          continue;
        }
        
        if (tableData && tableData.length > 0) {
          sqlQueries += `-- Dados para tabela: ${tableName}\n`;
          
          // Adicionar estrutura da tabela baseada no primeiro objeto
          const firstObject = tableData[0];
          const columns = Object.keys(firstObject);
          
          sqlQueries += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
          columns.forEach((column, index) => {
            const value = firstObject[column];
            let sqlType = "";
            
            if (typeof value === 'number') {
              sqlType = Number.isInteger(value) ? "INTEGER" : "NUMERIC";
            } else if (typeof value === 'boolean') {
              sqlType = "BOOLEAN";
            } else if (typeof value === 'object') {
              sqlType = value === null ? "TEXT" : (value instanceof Date ? "TIMESTAMP WITH TIME ZONE" : "JSONB");
            } else {
              sqlType = "TEXT";
            }
            
            sqlQueries += `  ${column} ${sqlType}${index < columns.length - 1 ? ',' : ''}\n`;
          });
          sqlQueries += `);\n\n`;
          
          // Adicionar dados
          for (const row of tableData) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row).map(formatValue).join(', ');
            
            sqlQueries += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
          }
          
          sqlQueries += "\n";
        } else {
          sqlQueries += `-- Nenhum dado encontrado na tabela: ${tableName}\n\n`;
        }
      } catch (err) {
        console.error(`Erro ao processar tabela ${tableName}:`, err);
        sqlQueries += `-- Não foi possível processar a tabela: ${tableName}\n`;
        sqlQueries += `-- Erro: ${err instanceof Error ? err.message : String(err)}\n\n`;
      }
    }
    
    console.log("Backup local do banco de dados concluído com sucesso!");
    return sqlQueries;
    
  } catch (error) {
    console.error("Erro durante o backup do banco de dados:", error);
    throw error;
  }
}

/**
 * Formata um valor para inserção em uma query SQL
 */
function formatValue(value: any): string {
  if (value === null) {
    return 'NULL';
  } else if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  } else if (typeof value === 'object' && value instanceof Date) {
    return `'${value.toISOString()}'`;
  } else if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  } else {
    return String(value);
  }
}

/**
 * Salva o backup em um arquivo de texto
 * @param sql Conteúdo SQL do backup
 * @returns Promise com URL para download do arquivo
 */
export function downloadSqlBackup(sql: string): string {
  const blob = new Blob([sql], { type: 'text/plain' });
  return URL.createObjectURL(blob);
}
