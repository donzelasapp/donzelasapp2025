import { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';
import { STORAGE_BUCKETS } from '../lib/constants';

interface SignedUrlInfo {
  url: string;
  file: File;
  expiresAt: number;
}

export const useSignedUrls = (userId: string | undefined, files: { name: string }[]) => {
  const [signedUrls, setSignedUrls] = useState<SignedUrlInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para gerar URLs assinadas
  const generateSignedUrls = async () => {
    if (!userId || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const newSignedUrls = await Promise.all(
        files.map(async (file) => {
          const { data, error } = await supabaseClient
            .storage
            .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
            .createSignedUrl(`${userId}/${file.name}`, 60 * 60 * 24); // 24 horas

          if (error || !data?.signedUrl) {
            throw new Error(`Erro ao gerar URL para ${file.name}: ${error?.message}`);
          }

          return {
            url: data.signedUrl,
            file: new File([new Blob()], file.name, { type: 'image/jpeg' }),
            expiresAt: Date.now() + (60 * 60 * 24 * 1000) // 24 horas em millisegundos
          };
        })
      );

      setSignedUrls(newSignedUrls);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao gerar URLs assinadas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar e renovar URLs próximas de expirar
  useEffect(() => {
    const checkAndRenewUrls = async () => {
      const now = Date.now();
      const threeHoursInMs = 3 * 60 * 60 * 1000; // 3 horas em millisegundos
      
      // Verificar se alguma URL está próxima de expirar (menos de 3 horas)
      const needsRenewal = signedUrls.some(
        url => (url.expiresAt - now) < threeHoursInMs
      );

      if (needsRenewal) {
        console.log('Renovando URLs próximas de expirar...');
        await generateSignedUrls();
      }
    };

    // Verificar a cada hora
    const interval = setInterval(checkAndRenewUrls, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [signedUrls, userId, files]);

  // Gerar URLs iniciais
  useEffect(() => {
    generateSignedUrls();
  }, [userId, files]);

  return { signedUrls, isLoading, error, refreshUrls: generateSignedUrls };
}; 