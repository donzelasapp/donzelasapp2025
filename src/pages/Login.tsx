import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import logoImage from '../assets/images/logo.svg';

// Componente de Login - Gerencia a autenticação do usuário
const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email.trim()) {
      setError('O email é obrigatório');
      return false;
    }
    if (!email.includes('@')) {
      setError('Email inválido');
      return false;
    }
    if (!password) {
      setError('A senha é obrigatória');
      return false;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('[Login] Iniciando processo de login...');
      const result = await signIn(email.trim().toLowerCase(), password);
      console.log('[Login] Login bem-sucedido:', result);
      
      // O redirecionamento será feito pelo AuthProvider através do evento SIGNED_IN
    } catch (error: any) {
      console.error('[Login] Erro:', error);
      setError(error.message || 'Erro ao fazer login. Tente novamente.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null); // Limpa erro ao digitar
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null); // Limpa erro ao digitar
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gradient-to-b from-primary/20 to-black">
      {/* Logo e título */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img src={logoImage} alt="Donzelas Logo" className="w-24 h-24" />
        </div>
        <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary to-rose-gold bg-clip-text text-transparent mb-4">
          DONZELAS
        </h1>
        <p className="text-gray-300 max-w-md text-center mb-8">
          Uma plataforma de relacionamento dedicada ao prazer e o bem-estar feminino.
        </p>
      </div>
      
      {/* Formulário de login */}
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-200">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Digite seu email"
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-200">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-400">ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/register')}
            disabled={loading}
            className="w-full py-2 px-4 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar uma nova conta
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
