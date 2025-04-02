import { STORAGE_BUCKETS, SUPABASE } from './constants';

/**
 * Gera uma URL direta para um arquivo no storage do Supabase
 * Contorna o problema com getPublicUrl e createSignedUrl
 */
export function getDirectStorageUrl(userId: string, fileName: string): string {
  // Usar o formato de URL específico para acesso aos arquivos no Supabase
  // Supabase tem um comportamento peculiar com encodificação de URLs
  // Esta função garante que a URL seja construída de forma compatível
  
  // Tratar encodificação de forma mais cuidadosa
  const encodedUserId = userId.replace(/\//g, '%2F').replace(/\+/g, '%2B');
  const encodedFileName = fileName.replace(/\//g, '%2F').replace(/\+/g, '%2B').replace(/ /g, '%20');
  
  return `https://${SUPABASE.PROJECT_ID}.supabase.co/storage/v1/object/public/${STORAGE_BUCKETS.PROFILE_PHOTOS}/${encodedUserId}/${encodedFileName}`;
}

/**
 * Formata um nome de arquivo para ser usado como cover (primeira foto)
 */
export function formatPhotoFileName(isFirst: boolean, originalName: string): string {
  // Remover caracteres especiais e espaços do nome do arquivo
  const fileExt = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  return isFirst ? `cover_${timestamp}.${fileExt}` : `photo_${timestamp}.${fileExt}`;
} 