
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
    
    // Lista abrangente de tabelas disponíveis para fazer backup
    const availableTables = [
      'clients',
      'service_orders',
      'service_order_items',
      'products',
      'stores',
      'nfse',
      'nfce',
      'fiscal_config',
      'certificates',
      'company_info',
      'service_order_statuses',
      'user_roles',
      'user_permissions',
      'profiles',
      'service_codes',
      'service_tax_codes',
      'nfce_items',
      'nfce_eventos',
      'nfce_config',
      'nfse_eventos',
      'nfse_config',
      'nfse_service_codes',
      'nfse_servicos',
      'nfse_sp_settings',
      'nfse_sp_config',
      'nfse_sp_lotes',
      'nfse_sefaz_logs',
      'service_order_attachments',
      'client_messages',
      'customer_area_settings',
      'licenses'
    ];
    
    console.log(`Gerando backup para ${availableTables.length} tabelas`);
    
    let sqlQueries = "-- Backup gerado em " + new Date().toISOString() + "\n\n";
    let tableStructures = "-- ESTRUTURAS DAS TABELAS\n\n";
    
    // Para cada tabela, obter seus dados
    for (const tableName of availableTables) {
      try {
        console.log(`Processando tabela: ${tableName}`);
        
        // Obter os primeiros registros de cada tabela
        const { data: tableData, error: dataError } = await supabase
          .from(tableName as any)
          .select('*')
          .limit(5); // Reduzido para 5 para focar na estrutura
        
        if (dataError) {
          console.error(`Erro ao obter dados da tabela ${tableName}:`, dataError);
          sqlQueries += `-- Não foi possível obter os dados da tabela: ${tableName}\n`;
          sqlQueries += `-- Erro: ${dataError.message}\n\n`;
          continue;
        }
        
        if (tableData && tableData.length > 0) {
          // Adicionar estrutura da tabela baseada no primeiro objeto
          const firstObject = tableData[0];
          const columns = Object.keys(firstObject);
          
          tableStructures += `-- Estrutura para tabela: ${tableName}\n`;
          tableStructures += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
          columns.forEach((column, index) => {
            const value = firstObject[column];
            let sqlType = "";
            
            if (typeof value === 'number') {
              sqlType = Number.isInteger(value) ? "INTEGER" : "NUMERIC";
            } else if (typeof value === 'boolean') {
              sqlType = "BOOLEAN";
            } else if (typeof value === 'object') {
              sqlType = value === null ? "TEXT" : (value && typeof value.getMonth === 'function' ? "TIMESTAMP WITH TIME ZONE" : "JSONB");
            } else {
              sqlType = "TEXT";
            }
            
            tableStructures += `  ${column} ${sqlType}${index < columns.length - 1 ? ',' : ''}\n`;
          });
          tableStructures += `);\n\n`;
          
          // Adicionar dados
          sqlQueries += `-- Dados para tabela: ${tableName}\n`;
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
    // Combinar estruturas e dados
    return tableStructures + "\n" + sqlQueries;
    
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
  } else if (typeof value === 'object' && value && typeof value.getMonth === 'function') {
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
