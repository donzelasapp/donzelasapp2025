import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://potbrowswhgtgfjmwr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Erro: Variável de ambiente VITE_SUPABASE_ANON_KEY é necessária');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyPolicies() {
  try {
    // Lê o arquivo SQL
    const sqlContent = readFileSync(
      join(__dirname, '../supabase/migrations/20240321_fix_profile_policies.sql'),
      'utf8'
    );

    // Divide o conteúdo em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    // Executa cada comando
    for (const command of commands) {
      console.log('Executando comando:', command);
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error) {
        console.error('Erro ao executar comando:', error);
        throw error;
      }
      console.log('Comando executado com sucesso');
    }

    console.log('Políticas aplicadas com sucesso!');
  } catch (error) {
    console.error('Erro ao aplicar políticas:', error);
    process.exit(1);
  }
}

applyPolicies(); 