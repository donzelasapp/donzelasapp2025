import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { supabaseClient } from '../lib/supabase';
import { User, Camera, X, LogOut, Save } from 'lucide-react';
import Navigation from '../components/Navigation';
import { STORAGE_BUCKETS } from '../lib/constants';
import { useSignedUrls } from '../hooks/useSignedUrls';
import { getDirectStorageUrl, formatPhotoFileName } from '../lib/helpers';

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  birthdate: string | null;
  phone: string | null;
  city: string | null;
  account_type: 'donzela' | 'plebeu' | null;
  about_me: string | null;
  interests: string[] | null;
  preferences: {
    age_range?: [number, number];
    distance?: number;
    notifications?: boolean;
  } | null;
  hobbies?: string[];
};

const Profile = () => {
  const { user, signOut, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [profilePhotos, setProfilePhotos] = useState<{url: string | null, path: string, file: File}[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [formData, setFormData] = useState<Profile>({
    id: '',
    name: '',
    email: '',
    birthdate: '',
    phone: '',
    city: '',
    account_type: null,
    about_me: '',
    interests: [],
    preferences: {
      age_range: [18, 50],
      distance: 50,
      notifications: true
    }
  });
  const [storedFiles, setStoredFiles] = useState<{name: string}[]>([]);
  
  // Usar o hook de URLs assinadas
  const { signedUrls, isLoading: urlsLoading, error: urlsError, refreshUrls } = useSignedUrls(
    user?.id,
    storedFiles
  );

  // Lista de hobbies predefinidos
  const HOBBIES_OPTIONS = [
    'Leitura', 'Cinema', 'Teatro',
    'Culinária', 'Viagens', 'Esportes',
    'Arte', 'Meditação', 'Academia', 'Natureza'
  ];

  // Lista de interesses predefinidos
  const INTERESTS_OPTIONS = [
    'Relacionamento sério', 'Encontros casuais'
  ];

  useEffect(() => {
    const getProfile = async () => {
      if (!user) {
        console.log('Usuário não autenticado');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Buscando dados do perfil para:', user.id);
        
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          throw error;
        }
        
        if (data) {
          console.log('Dados do perfil:', data);
          setFormData({
            id: data.id,
            name: data.name,
            email: user.email,
            birthdate: data.birthdate,
            phone: data.phone,
            city: data.city,
            account_type: data.account_type,
            about_me: data.about_me,
            interests: Array.isArray(data.interests) ? data.interests : [],
            preferences: {
              age_range: data.preferences?.age_range || [18, 50],
              distance: data.preferences?.distance || 50,
              notifications: data.preferences?.notifications || true
            },
            hobbies: Array.isArray(data.hobbies) ? data.hobbies : [],
          });
          
          // Buscar fotos do usuário imediatamente após carregar o perfil
          await fetchUserPhotos();
          
          // Buscar cidades disponíveis se tiver DDD
          if (data.phone) {
            const phoneDigits = data.phone.replace(/\D/g, '');
            if (phoneDigits.length >= 2) {
              fetchCitiesByDDD(phoneDigits.slice(0, 2));
            }
          }
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [user]);

  // Função para buscar fotos
  const fetchUserPhotos = async () => {
    try {
      console.log('=== INÍCIO FETCH FOTOS ===');
      console.log('1. ID do usuário:', user?.id);
      
      if (!user?.id) {
        console.log('2. Usuário não encontrado');
        return;
      }

      console.log('3. Bucket:', STORAGE_BUCKETS.PROFILE_PHOTOS);
      
      // Buscar fotos do usuário na pasta específica dele
      const { data: files, error } = await supabaseClient
        .storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .list(user.id);
      
      if (error) {
        console.error('4. Erro ao listar arquivos:', error);
        console.error('4.1 Detalhes do erro:', JSON.stringify(error, null, 2));
        setStoredFiles([]);
        return;
      }
      
      console.log('5. Arquivos encontrados:', files?.length || 0);
      console.log('6. Lista de arquivos:', files);

      if (!files || files.length === 0) {
        console.log('7. Nenhuma foto encontrada');
        setStoredFiles([]);
        return;
      }

      // Atualizar a lista de arquivos armazenados
      const sortedFiles = files
        .filter(file => {
          const isImage = file.name.match(/\.(jpg|jpeg|png|gif)$/i);
          console.log(`8. Verificando arquivo ${file.name}: ${isImage ? 'é imagem' : 'não é imagem'}`);
          return isImage;
        })
        .sort((a, b) => {
          if (a.name.startsWith('cover_')) return -1;
          if (b.name.startsWith('cover_')) return 1;
          return 0;
        });

      console.log('9. Arquivos ordenados:', sortedFiles);
      
      // Em vez de gerar URLs, usaremos o método de download para cada imagem
      // quando ela for renderizada. Apenas armazenar metadados por enquanto.
      const photosWithMetadata = sortedFiles.map(file => {
        return {
          url: null, // Usaremos download sob demanda
          path: `${user.id}/${file.name}`,
          file: new File([new Blob()], file.name, { type: 'image/jpeg' })
        };
      });
      
      console.log('10. Fotos processadas:', photosWithMetadata.length);
      setProfilePhotos(photosWithMetadata);
      setStoredFiles(sortedFiles);
      console.log('=== FIM FETCH FOTOS ===');
    } catch (error: any) {
      console.error('ERRO GERAL:', error);
      console.error('Stack trace:', error.stack);
      setStoredFiles([]);
      setProfilePhotos([]);
    }
  };

  // Buscar fotos quando o componente montar
  useEffect(() => {
    fetchUserPhotos();
  }, [user?.id]);

  // Função para buscar cidades pelo DDD
  const fetchCitiesByDDD = (ddd: string) => {
    // Aqui você pode fazer uma chamada a uma API real
    // Por enquanto, vamos simular com alguns dados locais
    const dddCities: Record<string, string[]> = {
      '11': ['São Paulo', 'Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo'],
      '21': ['Rio de Janeiro', 'Niterói', 'São Gonçalo', 'Duque de Caxias'],
      '31': ['Belo Horizonte', 'Contagem', 'Betim', 'Ribeirão das Neves'],
      '41': ['Curitiba', 'São José dos Pinhais', 'Colombo', 'Pinhais'],
      '51': ['Porto Alegre', 'Canoas', 'Gravataí', 'Viamão'],
      '61': ['Brasília', 'Taguatinga', 'Ceilândia', 'Gama'],
      '71': ['Salvador', 'Lauro de Freitas', 'Camaçari', 'Simões Filho'],
      '81': ['Recife', 'Olinda', 'Jaboatão dos Guararapes', 'Paulista'],
      // Adicione mais cidades conforme necessário
    };
    
    // Se encontrar cidades para o DDD, atualizar o estado
    if (dddCities[ddd] && dddCities[ddd].length > 0) {
      setAvailableCities(dddCities[ddd]);
    } else {
      setAvailableCities([]);
    }
  };

  // Para campo de telefone, aplicar máscara
  const formatPhone = (value: string) => {
    // Remover caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Aplicar máscara de telefone
    let formattedValue = '';
    if (numericValue.length <= 2) {
      formattedValue = numericValue;
    } else if (numericValue.length <= 6) {
      formattedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
    } else if (numericValue.length <= 10) {
      formattedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 6)}-${numericValue.slice(6)}`;
    } else {
      formattedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`;
    }
    
    return formattedValue;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'phone') {
      // Formatar telefone
      const formattedPhone = formatPhone(value);
      
      // Verificar se o DDD mudou para atualizar cidades
      const numericValue = value.replace(/\D/g, '');
      
      // Limpar cidade e lista de cidades se o telefone estiver incompleto
      if (numericValue.length < 2) {
        setAvailableCities([]);
        setFormData(prev => ({
          ...prev,
          city: '',
          phone: formattedPhone
        }));
        return;
      }
      
      // Se tiver DDD completo (2 dígitos)
      if (numericValue.length >= 2) {
        const newDDD = numericValue.slice(0, 2);
        const oldPhone = formData.phone || '';
        const oldDDD = oldPhone.length >= 2 ? oldPhone.replace(/\D/g, '').slice(0, 2) : '';
        
        // Se o DDD mudou, limpar a cidade e buscar novas cidades
        if (newDDD !== oldDDD) {
          fetchCitiesByDDD(newDDD);
          setFormData(prev => ({
            ...prev,
            city: '',
            phone: formattedPhone
          }));
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        phone: formattedPhone
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferencesChange = (
    field: 'age_range' | 'distance' | 'notifications',
    value: [number, number] | number | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  // Função para adicionar foto
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      console.log('=== INÍCIO UPLOAD ===');
      console.log('1. Arquivo:', {
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        ultimaModificacao: new Date(file.lastModified).toISOString()
      });
      console.log('2. Total de fotos atual:', storedFiles.length);
      console.log('3. Lista atual:', storedFiles.map(f => f.name));
      
      // Verificação rigorosa do limite de fotos
      if (storedFiles.length >= 5) {
        console.log('4. Limite de fotos atingido');
        setMessage({
          text: 'Você já atingiu o limite máximo de 5 fotos.',
          type: 'error'
        });
        return;
      }
      
      // Verificar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        console.log('5. Tipo de arquivo inválido:', file.type);
        setMessage({
          text: 'Por favor, selecione apenas imagens.',
          type: 'error'
        });
        return;
      }
      
      // Verificar se é realmente uma imagem
      try {
        // Criar URL temporária para testar a imagem
        const tempURL = URL.createObjectURL(file);
        const img = new Image();
        
        img.onload = async () => {
          URL.revokeObjectURL(tempURL); // Liberar memória
          
          // Se chegou aqui, é uma imagem válida
          try {
            await uploadPhoto(file);
          } catch (error: any) {
            console.error('Erro no processo de upload:', error);
            setMessage({
              text: `Erro ao fazer upload: ${error.message}`,
              type: 'error'
            });
            setSaving(false);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(tempURL); // Liberar memória
          console.error('5.1 Arquivo não é uma imagem válida');
          setMessage({
            text: 'O arquivo selecionado não é uma imagem válida.',
            type: 'error'
          });
          setSaving(false);
        };
        
        img.src = tempURL;
      } catch (error: any) {
        console.error('5.2 Erro ao verificar imagem:', error);
        setMessage({
          text: 'Erro ao processar a imagem. Tente novamente.',
          type: 'error'
        });
        setSaving(false);
      }
    }
  };
  
  // Função isolada para o upload
  const uploadPhoto = async (file: File) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      setSaving(true);
      
      // Usar nome de arquivo simplificado sem caracteres especiais
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const simpleName = storedFiles.length === 0 
        ? `cover_${timestamp}.${fileExt}`
        : `photo_${timestamp}.${fileExt}`;
      
      console.log('6. Nome do arquivo para upload:', simpleName);
      console.log('7. Caminho completo:', `${user.id}/${simpleName}`);
      
      // Upload para o Supabase
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .upload(`${user.id}/${simpleName}`, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: true
        });
        
      if (uploadError) {
        console.error('8. Erro no upload:', uploadError);
        console.error('8.1 Detalhes do erro:', JSON.stringify(uploadError, null, 2));
        throw uploadError;
      }

      console.log('9. Upload realizado com sucesso:', uploadData);
      
      // Atualizar lista de arquivos
      console.log('10. Atualizando lista de arquivos...');
      
      // Importante: aguardar um pouco para o servidor processar o upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      await fetchUserPhotos();
      
      console.log('11. Lista atualizada com sucesso');
      setMessage({
        text: 'Foto adicionada com sucesso!',
        type: 'success'
      });
      
      setSaving(false);
    } catch (error) {
      throw error;
    }
  };

  // Função para remover foto
  const removePhoto = async (index: number) => {
    try {
      if (!user) return;

      console.log('=== INÍCIO REMOÇÃO DE FOTO ===');
      console.log('1. Removendo foto do índice:', index);

      const fileToRemove = storedFiles[index];
      
      if (fileToRemove) {
        console.log('2. Arquivo a ser removido:', fileToRemove.name);
        
        // Remover o arquivo do storage
        const { error: removeError } = await supabaseClient
          .storage
          .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
          .remove([`${user.id}/${fileToRemove.name}`]);

        if (removeError) {
          console.error('3. Erro ao remover arquivo:', removeError);
          throw removeError;
        }

        console.log('4. Arquivo removido com sucesso');
        
        // Atualizar a lista de arquivos
        await fetchUserPhotos();
      }

      console.log('=== FIM REMOÇÃO DE FOTO ===');

    } catch (error: any) {
      console.error('ERRO GERAL:', error);
      setMessage({
        text: `Erro ao remover foto: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      setMessage(null);
      
      // Verificar limite de fotos
      if (profilePhotos.length > 5) {
        throw new Error('Número máximo de fotos excedido. Por favor, remova algumas fotos.');
      }

      // Verificar mínimo de fotos
      if (profilePhotos.length < 3) {
        throw new Error('É necessário ter no mínimo 3 fotos no perfil.');
      }
      
      // Atualizar o perfil
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          about_me: formData.about_me || '',
          hobbies: formData.hobbies || [],
          interests: formData.interests || []
        })
        .eq('id', user.id);
      
      if (updateError) {
        throw new Error(`Erro ao atualizar informações do perfil: ${updateError.message}`);
      }
      
      setMessage({ 
        text: 'Perfil atualizado com sucesso!', 
        type: 'success' 
      });

      setTimeout(() => {
        setMessage(null);
      }, 3000);

    } catch (error: any) {
      console.error('Erro completo:', error);
      setMessage({ 
        text: `Erro ao atualizar: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Tem certeza que deseja sair?")) {
      try {
        await signOut();
      } catch (error) {
        console.error('Erro ao tentar sair:', error);
        setMessage({
          text: 'Erro ao fazer logout. Tente novamente.',
          type: 'error'
        });
      }
    }
  };

  // Verificar bucket ao iniciar
  useEffect(() => {
    const checkBucket = async () => {
      try {
        console.log('=== VERIFICANDO CONFIGURAÇÃO DO BUCKET ===');
        
        // Verificar se o bucket existe
        const { data: buckets, error: bucketsError } = await supabaseClient
          .storage
          .listBuckets();
        
        if (bucketsError) {
          console.error('Erro ao listar buckets:', bucketsError);
          return;
        }
        
        const profileBucket = buckets?.find(b => b.name === STORAGE_BUCKETS.PROFILE_PHOTOS);
        
        if (!profileBucket) {
          console.error(`Bucket ${STORAGE_BUCKETS.PROFILE_PHOTOS} não encontrado!`);
          return;
        }
        
        console.log('Bucket encontrado:', profileBucket);
        console.log('Configuração pública:', profileBucket.public ? 'SIM' : 'NÃO');
        
        // Verificar se há arquivos no root (erro comum)
        const { data: rootFiles, error: rootError } = await supabaseClient
          .storage
          .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
          .list();
          
        if (rootError) {
          console.error('Erro ao listar arquivos do root:', rootError);
        } else {
          console.log('Arquivos no root do bucket:', rootFiles?.length || 0);
          if (rootFiles && rootFiles.length > 0) {
            console.log('Detalhes dos arquivos no root:', rootFiles);
          }
        }
        
        console.log('=== FIM DA VERIFICAÇÃO DO BUCKET ===');
      } catch (error) {
        console.error('Erro ao verificar bucket:', error);
      }
    };
    
    if (user?.id) {
      checkBucket();
    }
  }, [user?.id]);

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
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-white">Meu Perfil</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </header>
        
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          {/* Mensagem de sucesso/erro */}
          {message && (
            <div 
              className={`fixed top-4 right-4 left-4 mx-auto max-w-sm ${
                message.type === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              } px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in`}
            >
              <div className="flex items-center justify-center">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              {message.text}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção de fotos */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Fotos do Perfil (mínimo 3, máximo 5)
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {profilePhotos.map((photo, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-gray-700">
                    <div className="aspect-square relative bg-gray-900">
                      <SupabaseImage 
                        path={photo.path} 
                        index={index}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                      title="Remover foto"
                    >
                      <X size={16} />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs py-1 text-center font-medium">
                        Foto de capa
                      </div>
                    )}
                  </div>
                ))}
                
                {profilePhotos.length < 5 && (
                  <label className="border border-dashed rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:border-primary/70 transition-colors aspect-square">
                    <Camera size={24} className="text-gray-400" />
                    <span className="text-xs mt-1 text-gray-400">
                      Adicionar foto
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
            </div>
            
            {/* Informações básicas */}
              <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-200">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email || ''}
                  disabled
                  className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
              </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-200">
                  Nome
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                  disabled
                  className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white opacity-50 cursor-not-allowed"
                  />
                <p className="text-xs text-gray-400 mt-1">O nome não pode ser alterado</p>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-200">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone || ''}
                  disabled
                  className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">O telefone não pode ser alterado</p>
              </div>

              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium mb-1 text-gray-200">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate || ''}
                  disabled
                  className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">A data de nascimento não pode ser alterada</p>
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-1 text-gray-200">
                    Cidade
                  </label>
                  {availableCities.length > 0 ? (
                    <select
                      id="city"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                    className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white"
                  >
                    <option value="">Selecione uma cidade</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.city || ''}
                    disabled
                    className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white opacity-50 cursor-not-allowed"
                    placeholder="Cidade baseada no seu DDD"
                  />
                )}
              </div>

              <div>
                <label htmlFor="account_type" className="block text-sm font-medium mb-1 text-gray-200">
                  Tipo de Conta
                </label>
                <input
                  type="text"
                  id="account_type"
                  value={formData.account_type === 'donzela' ? 'Donzela' : 'Plebeu'}
                  disabled
                  className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">O tipo de conta não pode ser alterado</p>
              </div>

              <div>
                <label htmlFor="about_me" className="block text-sm font-medium mb-1 text-gray-200">
                  Conte um pouco sobre você
                </label>
                <textarea
                  id="about_me"
                  name="about_me"
                  value={formData.about_me || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white resize-none"
                  placeholder="Conte um pouco sobre você..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.about_me ? `${formData.about_me.length}/500 caracteres` : '0/500 caracteres'}
                </p>
              </div>

              {/* Hobbies */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Hobbies
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {HOBBIES_OPTIONS.map((hobby) => (
                    <div
                      key={hobby}
                      onClick={() => {
                        setFormData(prev => {
                          const currentHobbies = prev.hobbies || [];
                          if (currentHobbies.includes(hobby)) {
                            return {
                              ...prev,
                              hobbies: currentHobbies.filter((h: string) => h !== hobby)
                            };
                          }
                          if (currentHobbies.length < 5) {
                            return {
                              ...prev,
                              hobbies: [...currentHobbies, hobby]
                            };
                          }
                          return prev;
                        });
                      }}
                      className={`p-2 rounded-lg cursor-pointer text-sm ${
                        formData.hobbies?.includes(hobby)
                          ? 'bg-primary/20 border-primary border'
                          : 'bg-black/50 border-gray-700 border hover:bg-primary/5'
                      }`}
                    >
                      {hobby}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.hobbies?.length || 0}/5 selecionados
                </p>
                </div>
                
              {/* Interesses */}
                <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Interesse em...
                  </label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERESTS_OPTIONS.map((interest) => (
                    <div
                      key={interest}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          interests: prev.interests?.includes(interest) 
                            ? [] 
                            : [interest]
                        }));
                      }}
                      className={`p-2 rounded-lg cursor-pointer text-sm text-center ${
                        formData.interests?.includes(interest)
                          ? 'bg-primary/20 border-primary border text-primary'
                          : 'bg-black/50 border-gray-700 border hover:bg-primary/5'
                      }`}
                    >
                      {interest}
                  </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.interests && formData.interests.length > 0 
                    ? `Selecionado: ${formData.interests[0]}`
                    : 'Nenhum interesse selecionado'}
                </p>
              </div>

            </div>
            
            <div className="pt-6 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={saving}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
            </div>
          </form>
        </div>
      </div>
      <Navigation />
    </div>
  );
};

// Adicionar este componente dentro do Profile
// Componente para lidar com imagens do Supabase com download direto
const SupabaseImage = ({ path, index }: { path: string; index: number }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const downloadImage = async () => {
      try {
        setLoading(true);
        console.log(`Baixando imagem ${index} de ${path}...`);
        
        // Download da imagem do Supabase
        const { data, error } = await supabaseClient
          .storage
          .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
          .download(path);
          
        if (error) {
          console.error(`Erro ao baixar imagem ${index}:`, error);
          setError(true);
          return;
        }
        
        // Converter para URL de objeto
        const url = URL.createObjectURL(data);
        console.log(`URL da imagem ${index} criada:`, url);
        setSrc(url);
      } catch (err) {
        console.error(`Erro ao processar imagem ${index}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    downloadImage();
    
    // Limpar URL de objeto ao desmontar
    return () => {
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [path, index]);
  
  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white"></div>
      </div>
    );
  }
  
  if (error || !src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500">
        Erro
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={`Foto de perfil ${index + 1}`}
      className="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
    />
  );
};

export default Profile; 
