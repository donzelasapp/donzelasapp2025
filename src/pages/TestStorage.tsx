import { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';
import { STORAGE_BUCKETS } from '../lib/constants';

export default function TestStorage() {
  const [files, setFiles] = useState<any[]>([]);
  const [folderContents, setFolderContents] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        // Listar todos os arquivos/pastas do bucket raiz
        const { data, error } = await supabaseClient
          .storage
          .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
          .list('', {
            limit: 100
          });

        if (error) throw error;
        
        setFiles(data || []);

        // Para cada pasta (que seria um ID de usuário), listar seu conteúdo
        const folderData: Record<string, any[]> = {};
        for (const item of data || []) {
          if (item.id) { // é uma pasta
            const { data: contents, error: contentsError } = await supabaseClient
              .storage
              .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
              .list(item.name, {
                limit: 100
              });
            
            if (!contentsError) {
              folderData[item.name] = contents || [];
            }
          }
        }
        
        setFolderContents(folderData);
      } catch (err: any) {
        console.error('Erro ao listar arquivos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadFiles();
  }, []);

  // Função para testar URL pública
  const testPublicUrl = (folderId: string, fileName: string) => {
    const { data } = supabaseClient
      .storage
      .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
      .getPublicUrl(`${folderId}/${fileName}`);

    window.open(data.publicUrl, '_blank');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico de Storage</h1>
      
      {loading && <p className="text-blue-500 font-medium">Carregando...</p>}
      {error && <p className="text-red-500">Erro: {error}</p>}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Arquivos/Pastas na Raiz:</h2>
        {files.length === 0 ? (
          <p className="text-red-500">Nenhum arquivo ou pasta encontrado na raiz</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {files.map((file, i) => (
              <li key={i} className={file.id ? "font-semibold" : ""}>
                {file.name} 
                {file.id && <span className="ml-2 text-blue-500">(Pasta)</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-2">Conteúdo das Pastas:</h2>
        {Object.keys(folderContents).length === 0 ? (
          <p className="text-red-500">Nenhuma pasta encontrada</p>
        ) : (
          Object.entries(folderContents).map(([folder, contents]) => (
            <div key={folder} className="p-4 border rounded-lg bg-white">
              <h3 className="font-medium text-lg mb-2">{folder}:</h3>
              {contents.length === 0 ? (
                <p className="text-red-500">Pasta vazia</p>
              ) : (
                <ul className="list-disc pl-5">
                  {contents.map((file, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {file.name}
                      <button 
                        onClick={() => testPublicUrl(folder, file.name)}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Testar URL
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 