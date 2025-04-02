// Constantes do Storage
export const STORAGE_BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos' // Nome exato usado no Supabase
} as const;

// Constantes do servidor Supabase
export const SUPABASE = {
  PROJECT_ID: 'potbcroawzbgtqfjmuwr' // ID do projeto Supabase para construção de URLs diretas
} as const;

// Garante que os nomes dos buckets não podem ser alterados
Object.freeze(STORAGE_BUCKETS);
Object.freeze(SUPABASE); 