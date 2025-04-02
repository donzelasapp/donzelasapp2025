import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { supabaseClient } from '../lib/supabase';
import { RateLimitHandler } from '../utils/rateLimitHandler';
import { STORAGE_BUCKETS } from '../lib/constants';

const Register2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, saveUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  // Receber os dados da etapa 1 e 2
  const { formDataStep1, formDataStep2, profilePhotos } = location.state || {};

  const [formData, setFormData] = useState({
    hobbies: formDataStep2?.hobbies || [] as string[],
    interesses: formDataStep2?.interesses || [] as string[],
    sobre_mim: formDataStep2?.sobre_mim || ''
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para validar o formulário
  const checkFormValidity = () => {
    return formData.interesses && formData.interesses.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Validar dados antes de enviar
      if (!formDataStep1?.email || !formDataStep1?.password) {
        throw new Error('Dados de registro incompletos');
      }

      // 2. Criar usuário com autenticação
      const { data: authData, error: signUpError } = await signUp(
        formDataStep1.email,
        formDataStep1.password,
        formDataStep1.phone
      );

      if (signUpError) {
        throw signUpError;
      }

      // 3. Verificar se o usuário foi criado
      if (!authData?.user?.id) {
        throw new Error('ID do usuário não encontrado após cadastro');
      }

      // 4. Aguardar um momento para garantir que a sessão foi estabelecida
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 5. Salvar perfil do usuário
      const profileData = {
        nome: formDataStep1.nome,
        cidade: formDataStep1.cidade,
        phone: formDataStep1.phone,
        account_type: formDataStep1.account_type.toLowerCase(),
        data_nascimento: formDataStep1.data_nascimento,
        hobbies: formData.hobbies || [],
        interesses: formData.interesses || [],
        sobre_mim: formData.sobre_mim || ''
      };

      console.log('Tentando salvar perfil para usuário:', authData.user.id);
      console.log('Dados do perfil:', profileData);

      const { error: profileError } = await saveUserProfile(authData.user.id, profileData);

      if (profileError) {
        console.error('Erro ao salvar perfil:', profileError);
        throw profileError;
      }

      // 6. Fazer upload das fotos
      if (profilePhotos && profilePhotos.length > 0) {
        for (let i = 0; i < profilePhotos.length; i++) {
          const { file } = profilePhotos[i];
          const fileName = `${i === 0 ? 'cover_' : ''}${Date.now()}_${file.name}`;
          
          const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
            .upload(`${authData.user.id}/${fileName}`, file);
            
          if (uploadError) {
            console.error('Erro ao fazer upload da foto:', uploadError);
            throw uploadError;
          }
        }
      }

      // 7. Mostrar mensagem de sucesso e redirecionar
      setSuccessMessage(`Bem-vindo(a) ${formDataStep1.nome}! Seu cadastro foi realizado com sucesso.`);
      
      setTimeout(() => {
        navigate('/home');
      }, 2000);

    } catch (err: any) {
      console.error('Erro detalhado no cadastro:', err);
      let errorMessage = err.message || 'Erro ao salvar os dados';
      
      // Tratamento de erros específicos
      if (errorMessage.includes('duplicate key')) {
        errorMessage = 'Este email já está cadastrado';
      } else if (errorMessage.includes('permission denied')) {
        errorMessage = 'Erro de permissão ao criar perfil';
      } else if (errorMessage.includes('not found')) {
        errorMessage = 'Erro ao criar perfil: tabela não encontrada';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Se não houver dados da etapa 1, redirecionar para o início do cadastro
  useEffect(() => {
    if (!formDataStep1) {
      navigate('/register');
    }
  }, [formDataStep1, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gradient-to-b from-primary/20 to-black">
      {/* Logo e título */}
      <div className="text-center mb-8">
        <svg 
          width="80" 
          height="80" 
          viewBox="0 0 500 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto mb-4"
        >
          <path d="M340 10C320 30 300 70 290 90C280 110 260 140 240 170C220 200 210 220 200 240C190 260 180 290 170 320C160 350 150 380 140 410C130 440 120 470 110 490C100 510 90 520 80 530C70 540 60 550 50 560C40 570 30 580 20 590" stroke="#5c1374" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M200 200C180 220 160 240 140 260C120 280 100 300 80 320C60 340 40 360 30 380C20 400 10 420 10 440C10 460 20 480 40 500C60 520 80 540 100 520C120 500 140 480 160 460C180 440 200 420 220 400C240 380 260 360 280 340C300 320 320 300 340 280C360 260 380 240 400 220C420 200 440 180 460 160C480 140 500 120 520 100" stroke="#5c1374" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary to-rose-gold bg-clip-text text-transparent mb-4">
          DONZELAS
        </h1>
        <h2 className="text-2xl font-medium text-white mb-2">Complete seu Perfil</h2>
      </div>

      {/* Formulário */}
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        {successMessage ? (
          <div className="bg-primary/20 border-2 border-primary text-white px-6 py-4 rounded-lg mb-4 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-500 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="font-bold text-center text-xl mb-3">{successMessage}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hobbies */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Hobbies...
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
                      formData.hobbies.includes(hobby)
                        ? 'bg-primary/20 border-primary border'
                        : 'bg-black/50 border-gray-700 border hover:bg-primary/5'
                    }`}
                  >
                    {hobby}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formData.hobbies.length}/5 selecionados
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
                        interesses: [interest]
                      }));
                    }}
                    className={`p-2 rounded-lg cursor-pointer text-sm ${
                      formData.interesses?.includes(interest)
                        ? 'bg-primary/20 border-primary border'
                        : 'bg-black/50 border-gray-700 border hover:bg-primary/5'
                    }`}
                  >
                    {interest}
                  </div>
                ))}
              </div>
              {(!formData.interesses || formData.interesses.length === 0) && (
                <p className="text-red-400 text-xs mt-1">
                  Selecione um interesse (obrigatório)
                </p>
              )}
            </div>

            {/* Fale sobre você */}
            <div>
              <label htmlFor="sobre_mim" className="block text-sm font-medium mb-1 text-gray-200">
                Fale sobre você...
              </label>
              <textarea
                id="sobre_mim"
                name="sobre_mim"
                value={formData.sobre_mim}
                onChange={handleChange}
                className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white resize-none"
                placeholder="Conte um pouco sobre você..."
                maxLength={200}
                rows={4}
              />
              <div className="text-xs text-gray-400 mt-1">
                {formData.sobre_mim?.length || 0}/200 caracteres
              </div>
            </div>

            {/* Botão de envio e mensagem de erro */}
            <div className="space-y-3">
              {error && (
                <div className={`px-4 py-3 rounded-lg text-sm text-center ${
                  error.includes('Muitas tentativas') || error.includes('aguarde')
                    ? 'bg-yellow-500/10 border border-yellow-500 text-yellow-500'
                    : error.startsWith('Verificando') || error.startsWith('Criando') || error.startsWith('Fazendo upload')
                      ? 'bg-blue-500/10 border border-blue-500 text-blue-500'
                      : 'bg-red-500/10 border border-red-500 text-red-500'
                }`}>
                  <div className="flex items-center justify-center">
                    {(error.startsWith('Verificando') || error.startsWith('Criando') || error.startsWith('Fazendo upload')) && (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {error}
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !checkFormValidity()}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading || !checkFormValidity()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                ) : (
                  'FINALIZAR CADASTRO'
                )}
              </button>
            </div>

            {/* Botão para voltar */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/register', { 
                  state: { 
                    formDataStep2: formData,
                    formDataStep1: formDataStep1,
                    profilePhotos: profilePhotos
                  }
                })}
                className="w-full flex items-center justify-center py-2 px-4 border-2 border-primary/50 rounded-md shadow-sm text-sm font-medium text-primary hover:bg-primary/10 transition-colors duration-200"
                disabled={loading}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
                Voltar para Etapa Anterior
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register2; 