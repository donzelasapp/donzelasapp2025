import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { supabaseClient } from '../lib/supabase';
import { Heart, X, MessageCircle, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_BUCKETS } from '../lib/constants';

// Habilitar HMR
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      // Atualizar o componente quando o módulo for alterado
      newModule.default;
    }
  });
}

type Profile = {
  id: string;
  name: string;
  city: string;
  account_type: 'donzela' | 'plebeu';
  coverPhoto?: string;
  phone?: string;
};

// Mapa de DDDs próximos
const nearbyDDDs: { [key: string]: string[] } = {
  '11': ['12', '13', '19'], // São Paulo e região
  '15': ['11', '14', '16', '18'], // Sorocaba e região
  '12': ['11', '13'], // Vale do Paraíba
  '13': ['11', '12'], // Baixada Santista
  '14': ['15', '16', '17'], // Bauru e região
  '16': ['14', '15', '17'], // Ribeirão Preto
  '17': ['14', '16', '18'], // São José do Rio Preto
  '18': ['15', '17', '19'], // Presidente Prudente
  '19': ['11', '15', '18'], // Campinas
};

// Função para extrair DDD do telefone
const extractDDD = (phone: string): string | null => {
  if (!phone) return null;
  // Remove todos os caracteres não numéricos e pega os 2 primeiros dígitos
  const ddd = phone.replace(/\D/g, '').substring(0, 2);
  return ddd || null;
};

const Home = () => {
  const { user, userProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchedDDDs, setSearchedDDDs] = useState<string[]>([]);
  const navigate = useNavigate();

  // Função para buscar foto do perfil
  const fetchProfilePhoto = async (profileId: string) => {
    try {
      console.log('=== INÍCIO DEBUG FOTOS ===');
      console.log('1. ID do perfil:', profileId);
      console.log('2. Bucket:', STORAGE_BUCKETS.PROFILE_PHOTOS);
      
      // Listar arquivos na pasta do perfil
      const { data: files, error: listError } = await supabaseClient
        .storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .list(profileId);

      console.log('3. Tentando listar pasta do perfil:', profileId);
      console.log('4. Arquivos encontrados:', files);
      
      if (listError) {
        console.error('5. Erro ao listar arquivos:', listError);
        return null;
      }

      if (!files || files.length === 0) {
        console.log('6. Nenhum arquivo encontrado');
        return null;
      }

      // Procurar primeiro pela foto de capa
      const coverPhoto = files.find(file => file.name.startsWith('cover_'));
      const photoToUse = coverPhoto || files[0];

      console.log('7. Arquivo selecionado:', photoToUse.name);

      // Gerar URL pública
      const { data: publicUrl } = supabaseClient
        .storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .getPublicUrl(`${profileId}/${photoToUse.name}`);

      console.log('8. URL pública gerada:', publicUrl);

      if (!publicUrl?.publicUrl) {
        console.log('9. Não foi possível gerar URL pública');
        return null;
      }

      // Verificar se a URL é acessível
      try {
        const response = await fetch(publicUrl.publicUrl, { method: 'HEAD' });
        console.log('10. Status da resposta:', response.status);
        
        if (response.ok) {
          console.log('11. URL está acessível');
          return publicUrl.publicUrl;
        }
      } catch (error) {
        console.error('12. Erro ao verificar URL:', error);
      }

      console.log('=== FIM DEBUG FOTOS ===');
      return null;
    } catch (error) {
      console.error('ERRO GERAL:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError('');

        if (!user) {
          console.error('[Home] Usuário não autenticado');
          setError('Usuário não autenticado');
          setLoading(false);
          return;
        }

        // Buscar perfis do tipo plebeu
        console.log('[Home] Buscando perfis do tipo plebeu...');
        const { data: matchProfiles, error: matchError } = await supabaseClient
          .from('profiles')
          .select('id, name, city, account_type, phone')
          .eq('account_type', 'plebeu')
          .neq('id', user.id);

        if (matchError) {
          console.error('[Home] Erro ao buscar perfis:', matchError);
          throw matchError;
        }

        // Buscar fotos dos perfis
        const profilesWithPhotos = await Promise.all(
          matchProfiles.map(async (profile) => {
            const photoUrl = await fetchProfilePhoto(profile.id);
            return photoUrl ? { ...profile, coverPhoto: photoUrl } : profile;
          })
        );

        console.log('[Home] Perfis com fotos:', profilesWithPhotos.length);
        setProfiles(profilesWithPhotos);
        setCurrentIndex(0);
      } catch (error) {
        console.error('[Home] Erro ao buscar perfis:', error);
        setError('Erro ao carregar perfis');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user]);

  const handleLike = async (profileId: string) => {
    try {
      const { error } = await supabaseClient
        .from('likes')
        .insert({
          user_id: user?.id,
          liked_user_id: profileId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Avançar para o próximo perfil
      setCurrentIndex(prev => Math.min(prev + 1, profiles.length));
    } catch (err) {
      console.error('Erro ao curtir perfil:', err);
    }
  };

  const handleReject = () => {
    // Avançar para o próximo perfil
    setCurrentIndex(prev => Math.min(prev + 1, profiles.length));
  };

  const handleMessage = async (profileId: string) => {
    try {
      const { error } = await supabaseClient
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: profileId,
          content: 'Olá! Vi seu perfil e gostaria de conversar.',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      navigate('/chats');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="text-white">Carregando perfis...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] p-4">
          <div className="text-white text-center mb-4">
            Não há plebeus em sua cidade ainda.
          </div>
          {searchedDDDs.length > 0 && (
            <div className="text-gray-400 text-sm text-center">
              Buscamos em {searchedDDDs.length} {searchedDDDs.length === 1 ? 'região' : 'regiões'} (DDDs: {searchedDDDs.join(', ')})
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="text-white">Não há mais perfis disponíveis no momento.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-black">
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-display font-bold text-white">
            {userProfile?.account_type === 'donzela' ? 
              'Plebeus em sua cidade' : 
              'Donzelas em sua cidade'}
          </h1>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Configurações"
            >
              <Settings size={20} className="text-white" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors flex items-center"
            >
              <span className="mr-2">Editar Perfil</span>
              <span className="text-sm text-gray-300">({userProfile?.city})</span>
            </button>
          </div>
        </div>

        {currentProfile ? (
          <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm">
            <div className={`absolute inset-0 ${
              currentProfile.account_type === 'donzela' ? 'bg-pink-900/30' : 'bg-blue-900/30'
            }`}>
              {currentProfile.coverPhoto ? (
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                    <User size={64} className="text-white/50" />
                  </div>
                  <img 
                    src={currentProfile.coverPhoto}
                    alt={currentProfile.name}
                    className="w-full h-full object-cover relative z-10"
                    onLoad={(e) => {
                      console.log('[Home] Imagem carregada com sucesso:', currentProfile.coverPhoto);
                      const img = e.target as HTMLImageElement;
                      const fallback = img.previousElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.opacity = '0';
                      }
                    }}
                    onError={(e) => {
                      console.error('[Home] Erro ao carregar imagem:', currentProfile.coverPhoto);
                      const img = e.target as HTMLImageElement;
                      const fallback = img.previousElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.opacity = '1';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-900/50">
                  <User size={64} className="text-white/50" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                <h3 className="text-2xl font-semibold text-white mb-2">{currentProfile.name}</h3>
                <p className="text-lg text-gray-300">{currentProfile.city}</p>
                
                <div className="mt-6 flex justify-between items-center">
                  <button 
                    onClick={() => handleReject()}
                    className="p-4 rounded-full bg-gray-800/80 hover:bg-red-900/50 transition-colors"
                  >
                    <X size={24} className="text-white" />
                  </button>
                  
                  <button 
                    onClick={() => handleMessage(currentProfile.id)}
                    className="p-4 rounded-full bg-gray-800/80 hover:bg-blue-900/50 transition-colors"
                  >
                    <MessageCircle size={24} className="text-white" />
                  </button>
                  
                  <button 
                    onClick={() => handleLike(currentProfile.id)}
                    className="p-4 rounded-full bg-gray-800/80 hover:bg-pink-900/50 transition-colors"
                  >
                    <Heart size={24} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            {userProfile?.account_type === 'donzela' ? 
                'Não há plebeus em sua cidade ainda.' : 
                'Não há donzelas disponíveis no momento.'}
            </div>
          )}
      </div>
    </div>
  );
};

export default Home;
