
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Função para obter um backup das tabelas do banco de dados em formato SQL
 * @returns Promise com as queries SQL para recriação das tabelas
 */
export async function generateDatabaseBackup(): Promise<string> {
  try {
    console.log("Iniciando backup do banco de dados...");
    
    // Obter lista de tabelas no esquema public
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error("Erro ao obter lista de tabelas:", tablesError);
      throw tablesError;
    }
    
    console.log(`Encontradas ${tables?.length || 0} tabelas para backup`);
    
    let sqlQueries = "-- Backup gerado em " + new Date().toISOString() + "\n\n";
    
    // Para cada tabela, obter seu schema e dados
    for (const table of tables || []) {
      const tableName = table.tablename;
      
      // Pular tabelas do sistema
      if (tableName.startsWith('pg_') || tableName.startsWith('_')) {
        continue;
      }
      
      console.log(`Processando tabela: ${tableName}`);
      
      // Obter estrutura da tabela
      const { data: tableSchema, error: schemaError } = await supabaseAdmin.rpc(
        'get_table_ddl',
        { table_name: tableName }
      );
      
      if (schemaError) {
        console.error(`Erro ao obter schema da tabela ${tableName}:`, schemaError);
        continue;
      }
      
      sqlQueries += `-- Estrutura para tabela: ${tableName}\n`;
      sqlQueries += tableSchema + ";\n\n";
      
      // Obter dados da tabela
      const { data: tableData, error: dataError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1000); // Limitar para evitar problemas com tabelas muito grandes
      
      if (dataError) {
        console.error(`Erro ao obter dados da tabela ${tableName}:`, dataError);
        continue;
      }
      
      if (tableData && tableData.length > 0) {
        sqlQueries += `-- Dados para tabela: ${tableName}\n`;
        
        for (const row of tableData) {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row).map(formatValue).join(', ');
          
          sqlQueries += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
        }
        
        sqlQueries += "\n";
      }
    }
    
    console.log("Backup do banco de dados concluído com sucesso!");
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
