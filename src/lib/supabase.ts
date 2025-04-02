import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se temos as credenciais
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase. Verifique o arquivo .env');
}

// Criar uma única instância do cliente Supabase
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: 'sb-auth-token',
    flowType: 'implicit'
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  }
});

// Função para verificar a conexão
export const checkConnection = async () => {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('[Supabase] Erro ao verificar sessão:', error);
      return false;
    }
    return !!session;
  } catch (error) {
    console.error('[Supabase] Erro ao conectar:', error);
    return false;
  }
};

let storageSetupPromise: Promise<boolean> | null = null;

// Função para configurar o bucket de armazenamento
export const setupStorage = async () => {
  if (storageSetupPromise) {
    return storageSetupPromise;
  }

  storageSetupPromise = (async () => {
    try {
      console.log('[Storage] Iniciando configuração...');

      const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();
      
      if (listError) {
        console.error('[Storage] Erro ao listar buckets:', listError);
        return false;
      }

      const bucketName = 'profile-photos';
      const existingBucket = buckets?.find(b => b.name === bucketName);

      if (!existingBucket) {
        console.log('[Storage] Criando novo bucket:', bucketName);
        
        const { error: createError } = await supabaseClient.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
          fileSizeLimit: 1024 * 1024 * 2 // 2MB
        });

        if (createError) {
          console.error('[Storage] Erro ao criar bucket:', createError);
          return false;
        }
      }

      console.log('[Storage] Configuração concluída com sucesso');
      return true;
    } catch (error) {
      console.error('[Storage] Erro inesperado:', error);
      return false;
    }
  })();

  return storageSetupPromise;
};

export default supabaseClient; 