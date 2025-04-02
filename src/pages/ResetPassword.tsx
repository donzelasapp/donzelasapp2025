import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../lib/supabase';
import logoImage from '../assets/images/logo.svg';
import { useAuth } from '../auth';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hash, setHash] = useState('');

  // Obter o hash da URL
  useEffect(() => {
    // Verificar se o link contém um hash de acesso na URL
    const urlParams = new URLSearchParams(window.location.search);
    const hashFromUrl = urlParams.get('token');
    
    if (hashFromUrl) {
      setHash(hashFromUrl);
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (newPassword.length < 6) {
      setMessage({
        text: 'A senha deve ter pelo menos 6 caracteres',
        type: 'error'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({
        text: 'As senhas não coincidem',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Atualizar a senha usando o hash do link de redefinição
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      setMessage({
        text: 'Senha atualizada com sucesso!',
        type: 'success'
      });
      
      // Redirecionar para a página de login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setMessage({
        text: error.message || 'Ocorreu um erro ao redefinir sua senha. Tente novamente.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-2xl font-medium text-white mb-2">Redefinir Senha</h2>
        <p className="text-gray-300 max-w-md text-center mb-8">
          Digite sua nova senha para acessar sua conta.
        </p>
      </div>
      
      {/* Formulário de redefinição de senha */}
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        {message && (
          <div className={`${
            message.type === 'success' 
              ? 'bg-green-900/50 border-green-500 text-green-200' 
              : 'bg-red-900/50 border-red-500 text-red-200'
            } px-4 py-2 rounded mb-4 border`}
          >
            {message.text}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleResetPassword}>
          {/* Campo de nova senha */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1 text-gray-200">
              Nova Senha
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          
          {/* Campo de confirmação de senha */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-200">
              Confirme a Nova Senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          
          {/* Botão de envio */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processando...' : 'Cadastrar Nova Senha'}
          </button>
          
          {/* Link para voltar ao login */}
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
            >
              Voltar para o login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 
