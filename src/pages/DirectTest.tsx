import React, { useState } from 'react';
import { supabaseClient } from '../lib/supabase';
import { useAuth } from '../auth';
import { STORAGE_BUCKETS } from '../lib/constants';

const DirectTest = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(0);

  const testSupabaseConnection = async () => {
    try {
      setMessage('Testando conexão com Supabase...');
      
      const { data, error } = await supabaseClient.from('profiles').select('count').limit(1);
      
      if (error) {
        throw error;
      }
      
      setMessage(`Conexão com Supabase estabelecida com sucesso! Contagem: ${data?.length || 0}`);
    } catch (error: any) {
      console.error('Erro de conexão:', error);
      setMessage(`Erro de conexão: ${error.message}`);
    }
  };

  const createDemoUsers = async () => {
    setIsCreating(true);
    setCreated(0);
    setMessage('Criando usuários de demonstração...');

    try {
      // Dados para criação
      const demoUsers = [
        // Donzelas
        {
          email: 'maria@donzelas.app',
          name: 'Maria Silva',
          phone: '(11) 99876-5432',
          city: 'São Paulo',
          account_type: 'donzela',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/female/1.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/2.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/3.jpg'
          ]
        },
        {
          email: 'julia@donzelas.app',
          name: 'Julia Santos',
          phone: '(11) 99876-1234',
          city: 'São Paulo',
          account_type: 'donzela',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/female/4.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/5.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/6.jpg'
          ]
        },
        {
          email: 'ana@donzelas.app',
          name: 'Ana Oliveira',
          phone: '(11) 99876-5678',
          city: 'São Paulo',
          account_type: 'donzela',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/female/7.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/8.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/9.jpg'
          ]
        },
        {
          email: 'carol@donzelas.app',
          name: 'Carolina Lima',
          phone: '(11) 99876-9012',
          city: 'São Paulo',
          account_type: 'donzela',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/female/10.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/11.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/12.jpg'
          ]
        },
        {
          email: 'beatriz@donzelas.app',
          name: 'Beatriz Costa',
          phone: '(11) 99876-3456',
          city: 'São Paulo',
          account_type: 'donzela',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/female/13.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/14.jpg',
            'https://xsgames.co/randomusers/assets/avatars/female/15.jpg'
          ]
        },
        // Plebeus
        {
          email: 'pedro@donzelas.app',
          name: 'Pedro Almeida',
          phone: '(11) 98765-4321',
          city: 'São Paulo',
          account_type: 'plebeu',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/male/1.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/2.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/3.jpg'
          ]
        },
        {
          email: 'lucas@donzelas.app',
          name: 'Lucas Ferreira',
          phone: '(11) 98765-1234',
          city: 'São Paulo',
          account_type: 'plebeu',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/male/4.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/5.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/6.jpg'
          ]
        },
        {
          email: 'joao@donzelas.app',
          name: 'João Santos',
          phone: '(11) 98765-5678',
          city: 'São Paulo',
          account_type: 'plebeu',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/male/7.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/8.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/9.jpg'
          ]
        },
        {
          email: 'rafael@donzelas.app',
          name: 'Rafael Costa',
          phone: '(11) 98765-9012',
          city: 'São Paulo',
          account_type: 'plebeu',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/male/10.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/11.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/12.jpg'
          ]
        },
        {
          email: 'gustavo@donzelas.app',
          name: 'Gustavo Lima',
          phone: '(11) 98765-3456',
          city: 'São Paulo',
          account_type: 'plebeu',
          photos: [
            'https://xsgames.co/randomusers/assets/avatars/male/13.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/14.jpg',
            'https://xsgames.co/randomusers/assets/avatars/male/15.jpg'
          ]
        }
      ];

      // Para cada usuário demo
      for (let i = 0; i < demoUsers.length; i++) {
        const demoUser = demoUsers[i];
        
        // 1. Criar conta de usuário
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
          email: demoUser.email,
          password: 'Senha123',
          options: {
            data: {
              name: demoUser.name,
              account_type: demoUser.account_type
            }
          }
        });

        if (authError) {
          console.error(`Erro ao criar usuário ${demoUser.email}:`, authError);
          continue;
        }

        if (authData?.user) {
          // 2. Atualizar perfil
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({
              name: demoUser.name,
              phone: demoUser.phone,
              city: demoUser.city,
              account_type: demoUser.account_type,
              birthdate: new Date(Date.now() - Math.floor(Math.random() * 10 + 20) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error(`Erro ao atualizar perfil ${demoUser.email}:`, profileError);
            continue;
          }

          // 3. Fazer upload das fotos
          for (let j = 0; j < demoUser.photos.length; j++) {
            const photoUrl = demoUser.photos[j];
            try {
              // Baixar a imagem
              const response = await fetch(photoUrl);
              const blob = await response.blob();
              
              // Criar um nome de arquivo
              const fileName = `demo_${Date.now()}_${j}.jpg`;
              
              // Upload para o Supabase
              const { error: uploadError } = await supabaseClient
                .storage
                .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
                .upload(`${authData.user.id}/${j === 0 ? 'cover_' : ''}${fileName}`, blob);

              if (uploadError) {
                console.error(`Erro ao fazer upload da foto ${j+1} para ${demoUser.email}:`, uploadError);
              }
            } catch (err) {
              console.error(`Erro ao processar foto ${j+1} para ${demoUser.email}:`, err);
            }
          }

          setCreated(prev => prev + 1);
        }
      }

      setMessage(`Criação concluída! ${created} usuários criados com sucesso.`);
    } catch (error: any) {
      console.error('Erro ao criar usuários de demonstração:', error);
      setMessage(`Erro ao criar usuários de demonstração: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-display font-bold text-white mb-6">Criar Perfis de Demonstração</h1>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={testSupabaseConnection}
              className="w-full btn-primary mb-4"
            >
              Testar Conexão com Supabase
            </button>
          </div>

          <div>
            <button
              onClick={createDemoUsers}
              disabled={isCreating}
              className={`w-full btn-primary ${isCreating ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isCreating ? `Criando usuários... (${created}/10)` : 'Criar 10 Usuários de Demonstração'}
            </button>
            <p className="text-xs text-gray-400 mt-1">
              Isso criará 5 donzelas e 5 plebeus com fotos e dados fictícios.
              Emails: maria@donzelas.app, julia@donzelas.app, etc.
              Senha para todos: Senha123
            </p>
          </div>
          
          {message && (
            <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectTest; 
