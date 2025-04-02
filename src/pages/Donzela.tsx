import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { supabaseClient } from '../lib/supabase';
import { Heart, X, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_BUCKETS } from '../lib/constants';

type Profile = {
  id: string;
  name: string;
  city: string;
  account_type: 'donzela' | 'plebeu';
  coverPhoto?: string;
};

// Componente Donzela - Área exclusiva com conteúdo sobre autoconhecimento e bem-estar
const Donzela = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfiles = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Buscar apenas perfis de donzelas
        const { data, error: fetchError } = await supabaseClient
          .from('profiles')
          .select('id, name, city, account_type')
          .neq('id', user.id)
          .eq('account_type', 'donzela');
        
        if (fetchError) {
          throw fetchError;
        }
        
        if (!data || data.length === 0) {
          setProfiles([]);
          setError('Nenhuma donzela encontrada para exibir.');
          return;
        }
        
        // Para cada perfil, buscar a foto de capa
        const profilesWithPhotos = await Promise.all(
          data.map(async (profile) => {
            // Buscar fotos do perfil
            const { data: files, error } = await supabaseClient
              .storage
              .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
              .list(profile.id);
            
            // Se encontrar fotos
            if (!error && files && files.length > 0) {
              // Procurar pela foto de capa primeiro
              const coverPhoto = files.find(photo => photo.name.startsWith('cover_')) || files[0];
              
              // Criar URL pública
              const { data: urlData } = await supabaseClient
                .storage
                .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
                .createSignedUrl(`${profile.id}/${coverPhoto.name}`, 60 * 60);
              
              return {
                ...profile,
                coverPhoto: urlData.signedUrl
              };
            }
            
            return profile;
          })
        );
        
        setProfiles(profilesWithPhotos);
        setError('');
      } catch (err: any) {
        console.error('Erro ao buscar perfis:', err);
        setError('Erro ao carregar donzelas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfiles();
  }, [user]);

  const handleLike = (profileId: string) => {
    console.log('Curtiu donzela:', profileId);
    // Aqui implementaria a lógica de like
  };

  const handleReject = (profileId: string) => {
    console.log('Rejeitou donzela:', profileId);
    setProfiles(prev => prev.filter(p => p.id !== profileId));
  };

  const handleMessage = (profileId: string) => {
    console.log('Enviar mensagem para donzela:', profileId);
    
    // Primeiro vamos verificar se já existe uma mensagem entre os usuários
    const checkExistingChat = async () => {
      try {
        // Verificar se há mensagens entre os usuários
        const { data, error } = await supabaseClient
          .from('messages')
          .select('id')
          .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user?.id})`)
          .limit(1);
        
        // Se não há mensagens, cria uma mensagem inicial para estabelecer o chat
        if ((!data || data.length === 0) && user) {
          // Criar primeira mensagem para iniciar a conversa
          await supabaseClient
            .from('messages')
            .insert({
              sender_id: user.id,
              receiver_id: profileId,
              content: "Olá! Vi seu perfil e gostaria de conversar.",
              created_at: new Date().toISOString()
            });
        }
        
        // Redirecionar para a página de chat
        navigate('/chats');
      } catch (err) {
        console.error('Erro ao iniciar conversa:', err);
      }
    };
    
    checkExistingChat();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-black pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Donzelas</h1>
          <p className="text-gray-300 mt-2">
            Conheça as donzelas disponíveis
          </p>
        </header>

        {error && profiles.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl text-center">
            <p className="text-gray-300">{error}</p>
            <p className="mt-4 text-sm text-gray-400">
              Volte em breve para ver novas donzelas.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {profiles.map(profile => (
              <div key={profile.id} className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl">
                <div className="relative h-80">
                  {profile.coverPhoto ? (
                    <img 
                      src={profile.coverPhoto} 
                      alt={profile.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary/40 to-primary/20 flex items-center justify-center">
                      <span className="text-white text-2xl font-medium">{profile.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h2 className="text-2xl font-semibold text-white">{profile.name}</h2>
                    <p className="text-gray-300">{profile.city}</p>
                  </div>
                </div>
                
                <div className="p-4 flex justify-between">
                  <button 
                    onClick={() => handleReject(profile.id)}
                    className="rounded-full bg-gray-800 p-3 hover:bg-red-900/50 transition-colors"
                  >
                    <X size={24} className="text-gray-400" />
                  </button>
                  
                  <button 
                    onClick={() => handleMessage(profile.id)}
                    className="rounded-full bg-gray-800 p-3 hover:bg-blue-900/50 transition-colors"
                  >
                    <MessageCircle size={24} className="text-gray-400" />
                  </button>
                  
                  <button 
                    onClick={() => handleLike(profile.id)}
                    className="rounded-full bg-gray-800 p-3 hover:bg-pink-900/50 transition-colors"
                  >
                    <Heart size={24} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Donzela;
