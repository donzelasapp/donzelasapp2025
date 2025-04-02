import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.tsx';
import { HotReloadTracker, useAutoSave } from '../lib/devUtils';
import { supabaseClient } from '../lib/supabase';

// Componente de Registro - Gerencia o cadastro de novos usuários
const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, saveUserProfile, updateUserProfile } = useAuth();
  const { formDataStep1: savedFormData, formDataStep2, profilePhotos: savedPhotos } = location.state || {};
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [isAgeValid, setIsAgeValid] = useState(true);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState<{url: string, file: File}[]>(
    savedPhotos || []
  );
  const [emailCopied, setEmailCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: savedFormData?.name || '',
    email: savedFormData?.email || '',
    password: savedFormData?.password || '',
    confirmPassword: savedFormData?.confirmPassword || '',
    phone: savedFormData?.phone || '',
    city: savedFormData?.city || '',
    birthdate: savedFormData?.birthdate || '',
    account_type: savedFormData?.account_type || ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  
  // Utilitário de desenvolvimento para auto-save e reload
  const devTools = useAutoSave();

  // Hook para rastrear recargas do componente durante o desenvolvimento
  useEffect(() => {
    HotReloadTracker.track('Register');
  }, []);

  // Função para calcular a idade a partir da data de nascimento
  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Função para validar email
  const validateEmail = (email: string) => {
    // Regex para validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Função para verificar se o email já existe
  const checkEmail = useCallback(async (email: string) => {
    if (!email) {
      setEmailError('O email é obrigatório');
      setIsEmailValid(false);
      return;
    }

    setIsCheckingEmail(true);
    try {
      // Primeiro verifica se o email é válido
      if (!validateEmail(email)) {
        setEmailError('Email inválido');
        setIsEmailValid(false);
        return;
      }

      // Não vamos mais verificar se o email existe
      setEmailError('');
      setIsEmailValid(true);

    } catch (err) {
      console.error('Erro ao verificar email:', err);
      setEmailError('Erro ao verificar email. Tente novamente.');
      setIsEmailValid(false);
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Função para verificar se o nome de usuário já existe
  const checkUsername = useCallback(async (username: string) => {
    if (!username) {
      setNameError('O nome de usuário é obrigatório');
      return;
    }
    
    console.log('Verificando nome de usuário:', username);
    setIsCheckingName(true);
    try {
      console.log('Fazendo consulta ao Supabase para o usuário:', username.trim());
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('name')
        .eq('name', username.trim());

      console.log('Resposta do Supabase:', { data, error });

      if (error) {
        console.error('Erro ao verificar nome de usuário:', error);
        setNameError('Erro ao verificar nome de usuário. Tente novamente.');
        return;
      }

      if (data && data.length > 0) {
        console.log('Nome de usuário já existe');
        setNameError('Este nome de usuário já está em uso');
      } else {
        console.log('Nome de usuário disponível');
        setNameError('');
      }
    } catch (err) {
      console.error('Erro ao verificar nome de usuário:', err);
      setNameError('Erro ao verificar nome de usuário. Tente novamente.');
    } finally {
      setIsCheckingName(false);
    }
  }, []);

  // Função para verificar se o telefone já existe
  const checkPhone = useCallback(async (phone: string) => {
    if (!phone) {
      setPhoneError('O telefone é obrigatório');
      setIsPhoneValid(false);
      return;
    }

    // Remover caracteres não numéricos
    const numericPhone = phone.replace(/\D/g, '');
    
    if (numericPhone.length < 11) {
      setPhoneError('Telefone inválido');
      setIsPhoneValid(false);
      return;
    }

    setIsCheckingPhone(true);
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('phone')
        .eq('phone', phone.trim());

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setPhoneError('Este telefone já está cadastrado');
        setIsPhoneValid(false);
      } else {
        setPhoneError('');
        setIsPhoneValid(true);
      }
    } catch (err) {
      console.error('Erro ao verificar telefone:', err);
      setPhoneError('Erro ao verificar telefone. Tente novamente.');
      setIsPhoneValid(false);
    } finally {
      setIsCheckingPhone(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    // Para o campo de email, remover espaços em branco e converter para minúsculas
    const finalValue = name === 'email' ? value.trim().toLowerCase() : value;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : finalValue
    }));

    // Resetar erro geral quando o email for alterado
    if (name === 'email') {
      setError('');
      setEmailError('');
      setIsEmailValid(false);
      
      if (!finalValue) {
        setEmailError('O email é obrigatório');
      } else if (!validateEmail(finalValue)) {
        setEmailError('Email inválido');
      } else {
        setEmailError('');
        setIsEmailValid(true);
      }
    }

    // Validação específica para nome de usuário
    if (name === 'name') {
      // Limpar estado anterior
      setNameError('');
      
      if (!value.trim()) {
        setNameError('O nome de usuário é obrigatório');
      } else {
        // Iniciar verificação após um pequeno delay
        const timeoutId = setTimeout(() => {
          checkUsername(value.trim());
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
    
    // Para campo de data de nascimento, calcular idade
    if (name === 'birthdate' && value) {
      // Verificar se temos uma data completa
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(value)) {
        // Verificar se a data é válida
        const dateObj = new Date(value);
        if (!isNaN(dateObj.getTime())) {
          const calculatedAge = calculateAge(value);
          setAge(calculatedAge);
          setIsAgeValid(calculatedAge >= 18 && calculatedAge <= 80);
        } else {
          setAge(null);
          setIsAgeValid(true);
        }
      } else {
        setAge(null);
        setIsAgeValid(true);
      }
    }
    
    // Para campo de telefone, aplicar máscara
    if (name === 'phone') {
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
      
      setFormData(prev => ({
        ...prev,
        phone: formattedValue
      }));
      
      // Buscar cidades quando DDD estiver completo (2 dígitos)
      if (numericValue.length >= 2) {
        const ddd = numericValue.slice(0, 2);
        fetchCitiesByDDD(ddd);
      } else {
        // Limpar lista de cidades se DDD incompleto
        setAvailableCities([]);
      }

      // Iniciar verificação após um pequeno delay
      const timeoutId = setTimeout(() => {
        checkPhone(formattedValue);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  // Função para buscar cidades pelo DDD
  const fetchCitiesByDDD = (ddd: string) => {
    // Aqui você poderia fazer uma chamada a uma API real
    // Por enquanto, vamos simular com alguns dados locais
    const dddCities: Record<string, string[]> = {
      '11': ['São Paulo', 'Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo'],
      '12': ['São José dos Campos', 'Taubaté', 'Jacareí', 'Pindamonhangaba'],
      '13': ['Santos', 'São Vicente', 'Praia Grande', 'Guarujá'],
      '14': ['Bauru', 'Marília', 'Jaú', 'Botucatu'],
      '15': ['Sorocaba', 'Itapetininga', 'Votorantim', 'Tatuí'],
      '16': ['Ribeirão Preto', 'Franca', 'São Carlos', 'Araraquara'],
      '17': ['São José do Rio Preto', 'Catanduva', 'Votuporanga', 'Fernandópolis'],
      '18': ['Presidente Prudente', 'Araçatuba', 'Assis', 'Birigui'],
      '19': ['Campinas', 'Piracicaba', 'Limeira', 'Americana'],
      '21': ['Rio de Janeiro', 'Niterói', 'São Gonçalo', 'Duque de Caxias'],
      '22': ['Campos dos Goytacazes', 'Macaé', 'Cabo Frio', 'Teresópolis'],
      '24': ['Petrópolis', 'Volta Redonda', 'Angra dos Reis', 'Barra Mansa'],
      '27': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica'],
      '28': ['Cachoeiro de Itapemirim', 'Linhares', 'São Mateus', 'Colatina'],
      '31': ['Belo Horizonte', 'Contagem', 'Betim', 'Ribeirão das Neves'],
      '32': ['Juiz de Fora', 'Barbacena', 'Muriaé', 'Viçosa'],
      '33': ['Governador Valadares', 'Teófilo Otoni', 'Ipatinga', 'Coronel Fabriciano'],
      '34': ['Uberlândia', 'Uberaba', 'Patos de Minas', 'Araguari'],
      '35': ['Poços de Caldas', 'Varginha', 'Pouso Alegre', 'Itajubá'],
      '37': ['Divinópolis', 'Sete Lagoas', 'Nova Serrana', 'Curvelo'],
      '38': ['Montes Claros', 'Janaúba', 'Januária', 'Pirapora'],
      '41': ['Curitiba', 'São José dos Pinhais', 'Ponta Grossa', 'Cascavel'],
      '42': ['Ponta Grossa', 'Guarapuava', 'União da Vitória', 'Irati'],
      '43': ['Londrina', 'Apucarana', 'Arapongas', 'Cornélio Procópio'],
      '44': ['Maringá', 'Paranavaí', 'Campo Mourão', 'Umuarama'],
      '45': ['Cascavel', 'Foz do Iguaçu', 'Toledo', 'Medianeira'],
      '46': ['Francisco Beltrão', 'Pato Branco', 'Dois Vizinhos', 'Chopinzinho'],
      '47': ['Joinville', 'Blumenau', 'Itajaí', 'Jaraguá do Sul'],
      '48': ['Florianópolis', 'São José', 'Palhoça', 'Criciúma'],
      '49': ['Chapecó', 'Lages', 'Caçador', 'Concórdia'],
      '51': ['Porto Alegre', 'Canoas', 'Novo Hamburgo', 'São Leopoldo'],
      '53': ['Pelotas', 'Rio Grande', 'Bagé', 'Camaquã'],
      '54': ['Caxias do Sul', 'Passo Fundo', 'Bento Gonçalves', 'Erechim'],
      '55': ['Santa Maria', 'Santo Ângelo', 'Uruguaiana', 'Santana do Livramento'],
      '61': ['Brasília', 'Taguatinga', 'Ceilândia', 'Gama'],
      '62': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde'],
      '63': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional'],
      '64': ['Rio Verde', 'Jataí', 'Mineiros', 'Catalão'],
      '65': ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop'],
      '66': ['Rondonópolis', 'Sinop', 'Barra do Garças', 'Primavera do Leste'],
      '67': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá'],
      '68': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
      '69': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena'],
      '71': ['Salvador', 'Lauro de Freitas', 'Camaçari', 'Simões Filho'],
      '73': ['Ilhéus', 'Itabuna', 'Porto Seguro', 'Teixeira de Freitas'],
      '74': ['Juazeiro', 'Senhor do Bonfim', 'Jacobina', 'Campo Formoso'],
      '75': ['Feira de Santana', 'Alagoinhas', 'Santo Antônio de Jesus', 'Valença'],
      '77': ['Vitória da Conquista', 'Barreiras', 'Guanambi', 'Bom Jesus da Lapa'],
      '79': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'],
      '81': ['Recife', 'Olinda', 'Jaboatão dos Guararapes', 'Paulista'],
      '82': ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios'],
      '83': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos'],
      '84': ['Natal', 'Mossoró', 'Parnamirim', 'Caicó'],
      '85': ['Fortaleza', 'Caucaia', 'Maracanaú', 'Juazeiro do Norte'],
      '86': ['Teresina', 'Parnaíba', 'Picos', 'Floriano'],
      '87': ['Petrolina', 'Garanhuns', 'Arcoverde', 'Serra Talhada'],
      '88': ['Juazeiro do Norte', 'Sobral', 'Crato', 'Iguatu'],
      '89': ['Picos', 'Floriano', 'São Raimundo Nonato', 'Oeiras'],
      '91': ['Belém', 'Ananindeua', 'Santarém', 'Marabá'],
      '92': ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
      '93': ['Santarém', 'Altamira', 'Itaituba', 'Oriximiná'],
      '94': ['Marabá', 'Parauapebas', 'Tucuruí', 'Redenção'],
      '95': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima'],
      '96': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
      '97': ['Coari', 'Tefé', 'Tabatinga', 'São Gabriel da Cachoeira'],
      '98': ['São Luís', 'Imperatriz', 'Timon', 'Caxias'],
      '99': ['Imperatriz', 'Codó', 'Bacabal', 'Açailândia']
    };
    
    // Se encontrar cidades para o DDD, atualizar o estado
    if (dddCities[ddd] && dddCities[ddd].length > 0) {
      setAvailableCities(dddCities[ddd]);
      // Não definir cidade automaticamente
      
      // Remover a mensagem de reinicialização ao encontrar cidades
    } else {
      setAvailableCities([]);
    }
  };

  // Função para remover uma foto
  const removePhoto = (index: number) => {
    setProfilePhotos(prev => {
      const newPhotos = [...prev];
      // Revogar URL para evitar vazamentos de memória
      URL.revokeObjectURL(newPhotos[index].url);
      newPhotos.splice(index, 1);
      
      return newPhotos;
    });
  };

  // Função para gerenciar upload de fotos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Verificar se já temos 5 fotos (máximo permitido)
      if (profilePhotos.length >= 5) {
        alert('Você já atingiu o limite máximo de 5 fotos.');
      return;
    }
    
      // Verificar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas imagens.');
      return;
    }

      // Criar URL para preview
      const imageUrl = URL.createObjectURL(file);
      
      // Adicionar ao estado
      const updatedPhotos = [...profilePhotos, {url: imageUrl, file}];
      setProfilePhotos(updatedPhotos);
      
      // Remover a mensagem de reinicialização ao atingir 3 fotos
    }
  };
  
  // Função para validar o formulário
  const checkFormValidity = () => {
    return (
      formData.email.length > 0 &&
      formData.password.length >= 6 &&
      formData.name.length > 0 &&
      formData.phone.length > 0 &&
      formData.city.length > 0 &&
      formData.birthdate &&
      formData.account_type
    );
  };

  // Efeito para atualizar o estado de validação do formulário
  useEffect(() => {
    const isValid = checkFormValidity();
    if (isFormValid !== isValid) {
      setIsFormValid(isValid);
    }
  }, [formData, isAgeValid, profilePhotos, nameError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    if (!checkFormValidity()) {
      setError('Por favor, preencha todos os campos corretamente.');
      return;
    }

    // Navegar para a próxima etapa com os dados
    navigate('/register2', {
      state: {
        formDataStep1: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          account_type: formData.account_type,
          birthdate: formData.birthdate
        },
        profilePhotos
      }
    });
  };

  // Função para copiar o email para a área de transferência
  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(formData.email)
      .then(() => {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      })
      .catch(err => console.error('Erro ao copiar: ', err));
  };

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
        <h2 className="text-2xl font-medium text-white mb-2">Criar Conta</h2>
      </div>
      
      {/* Formulário de cadastro */}
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        {successMessage && (
          <div className="bg-primary/20 border-2 border-primary text-white px-6 py-4 rounded-lg mb-4 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-500 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="font-bold text-center text-xl mb-3">{successMessage}</div>
            <div className="text-sm text-center">
              Enviamos um email de verificação para{' '}
              <button 
                onClick={copyEmailToClipboard}
                className="inline-flex items-center font-medium text-primary-light hover:underline"
                title="Clique para copiar"
              >
                {formData.email}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                {emailCopied && <span className="ml-1 text-xs text-green-300">(Copiado!)</span>}
              </button> 
              <p className="mt-2">Por favor, verifique sua caixa de entrada e confirme seu cadastro clicando no link enviado.</p>
            </div>
            <div className="mt-6 text-center">
              <button 
                onClick={() => navigate('/login')}
                className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors font-semibold shadow-md"
              >
                Ir para o login
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Upload de fotos */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Fotos do Perfil (mínimo 3, máximo 5)
            </label>
            
            {/* Contador de fotos */}
            <div className="mb-2 flex items-center">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    profilePhotos.length >= 3 
                      ? 'bg-green-500' 
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min((profilePhotos.length / 3) * 100, 100)}%` }}
                ></div>
              </div>
              <span className={`ml-2 text-xs ${
                profilePhotos.length >= 3 
                  ? 'text-green-500' 
                  : 'text-amber-500'
              }`}>
                {profilePhotos.length}/3+ 
                {profilePhotos.length >= 3 ? ' ✓' : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {/* Lista de fotos já adicionadas */}
              {profilePhotos.map((photo, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border border-gray-700">
                  <img 
                    src={photo.url} 
                    alt={`Foto de perfil ${index + 1}`} 
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                    title="Remover foto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs py-1 text-center font-medium">
                      Foto de capa
                    </div>
                  )}
                </div>
              ))}
              
              {/* Botão para adicionar foto, se ainda não tiver 5 */}
              {profilePhotos.length < 5 && (
                <label className={`border border-dashed rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transition-colors ${
                  profilePhotos.length < 3 
                    ? 'border-amber-500/50 hover:border-amber-500 hover:bg-amber-500/10'
                    : 'border-gray-700 hover:border-primary/70'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${
                    profilePhotos.length < 3 
                      ? 'text-amber-500/80' 
                      : 'text-gray-400'
                  }`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-xs mt-1 ${
                    profilePhotos.length < 3 
                      ? 'text-amber-500/80' 
                      : 'text-gray-400'
                  }`}>
                    {profilePhotos.length < 3 ? 'Adicionar foto (obrigatório)' : 'Adicionar foto (opcional)'}
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
            {profilePhotos.length < 3 && (
              <div className="text-xs text-amber-500 mt-1">
                É necessário adicionar pelo menos 3 fotos
              </div>
            )}
          </div>
          
          {/* Nome completo */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-200">
              Usuário
            </label>
            <div className="relative">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
                className={`w-full bg-black/50 rounded-lg border ${
                  nameError ? 'border-red-500' : 'border-gray-700'
                } px-4 py-2 text-white`}
              required
            />
              {isCheckingName && (
                <div className="absolute right-3 top-2">
                  <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            {nameError && (
              <p className="mt-1 text-xs text-red-400">
                {nameError}
              </p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-200">
              Email
            </label>
            <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
                className={`w-full bg-black/50 rounded-lg border ${
                  emailError ? 'border-red-500' : 'border-gray-700'
                } px-4 py-2 text-white pr-10`}
              required
            />
              {isCheckingEmail && (
                <div className="absolute right-3 top-2">
                  <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            {emailError && (
              <p className="mt-1 text-xs text-red-400">
                {emailError}
              </p>
            )}
          </div>
          
          {/* Data de nascimento */}
          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium mb-1 text-gray-200">
              Data de nascimento
            </label>
            <div className="relative">
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white"
                required
                min={new Date(new Date().setFullYear(new Date().getFullYear() - 80)).toISOString().split('T')[0]}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />
              {/* Mostrar informação de idade apenas se for uma data válida e dentro do intervalo permitido */}
              {age !== null && isAgeValid && (
                <div className="mt-1 text-sm text-green-400">
                  Idade: {age} anos
                </div>
              )}
            </div>
          </div>
          
          {/* Telefone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-200">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white"
              required
            />
          </div>
          
          {/* Cidade */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1 text-gray-200">
              Cidade
            </label>
            {availableCities.length > 0 ? (
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onClick={() => {
                  // Manter o dropdown aberto ao clicar
                }}
                className="w-full bg-primary/10 rounded-lg border border-primary/30 px-4 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                required
              >
                <option value="" className="bg-black/90 text-white">SELECIONE UMA CIDADE</option>
                {availableCities.map((city, index) => (
                  <option key={index} value={city} className="bg-black/90 text-white">{city}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white"
                required
              />
            )}
          </div>
          
          {/* Tipo de Conta: Donzela ou Plebeu */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Você é uma Donzela ou um Plebeu?
            </label>
            <div className="flex gap-4">
              <div 
                className={`flex-1 p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.account_type === 'donzela' 
                    ? 'border-primary bg-primary/20' 
                    : 'border-gray-700 bg-black/50 hover:bg-primary/5'
                }`}
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    account_type: 'donzela'
                  }));
                }}
              >
                <div className="flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.account_type === 'donzela' ? 'border-primary' : 'border-gray-400'
                  } flex items-center justify-center`}>
                    {formData.account_type === 'donzela' && (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                  <span className="ml-2 font-medium">Donzela</span>
                </div>
              </div>
              
              <div 
                className={`flex-1 p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.account_type === 'plebeu' 
                    ? 'border-primary bg-primary/20' 
                    : 'border-gray-700 bg-black/50 hover:bg-primary/5'
                }`}
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    account_type: 'plebeu'
                  }));
                }}
              >
                <div className="flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.account_type === 'plebeu' ? 'border-primary' : 'border-gray-400'
                  } flex items-center justify-center`}>
                    {formData.account_type === 'plebeu' && (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                  <span className="ml-2 font-medium">Plebeu</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-200">
              Senha (máx 15 caracteres)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                maxLength={15}
                className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white pr-10"
                required
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Restam {15 - formData.password.length} caracteres
            </div>
          </div>
          
          {/* Confirmação de senha */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-200">
              Confirme a senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                maxLength={15}
                className={`w-full bg-black/50 rounded-lg border ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword 
                    ? 'border-red-500' 
                    : 'border-gray-700'
                } px-4 py-2 text-white pr-10`}
                required
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="text-xs text-red-400 mt-1">
                As senhas não coincidem
              </div>
            )}
          </div>
          
          {/* Botão de próximo */}
          <button
            type="submit"
            disabled={loading || !checkFormValidity()}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading || !checkFormValidity()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
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
              'PRÓXIMO'
            )}
          </button>
          
          {/* Link para voltar ao login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
              disabled={loading}
            >
              Já tem uma conta? Faça login
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal de Termos de Uso */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Termos de Uso e Política de Privacidade</h2>
            
            <div className="prose prose-invert prose-sm">
              <h3>1. Introdução</h3>
              <p>
                Bem-vindo à Donzelas, uma plataforma dedicada ao prazer e bem-estar feminino. 
                Ao utilizar nossos serviços, você concorda com estes termos. Por favor, leia-os cuidadosamente.
              </p>
              
              <h3>2. Privacidade</h3>
              <p>
                Protegemos seus dados pessoais e só os utilizamos conforme descrito em nossa Política de Privacidade.
                Seus dados nunca serão compartilhados sem seu consentimento.
              </p>
              
              <h3>3. Conteúdo</h3>
              <p>
                Nosso conteúdo é destinado a maiores de 18 anos. Ao criar uma conta, você confirma ter idade legal.
              </p>
              
              <h3>4. Regras de Conduta</h3>
              <p>
                Respeitamos todas as usuárias. Não toleramos assédio, discriminação ou conteúdo ofensivo.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                className="btn-primary"
                onClick={() => setShowTerms(false)}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
