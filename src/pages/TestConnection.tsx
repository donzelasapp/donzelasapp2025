import React, { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const TestConnection = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Testando conexão com Supabase...');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testando conexão com Supabase...');
        console.log('URL:', supabaseClient.supabaseUrl);
        
        // Teste básico: ping para verificar se o Supabase está acessível
        const { data, error } = await supabaseClient.from('profiles').select('count', { count: 'exact' }).limit(1);
        
        if (error) {
          console.error('Erro ao conectar com Supabase:', error);
          setStatus('error');
          setMessage(`Erro ao conectar com Supabase: ${error.message}`);
          setErrorDetails(JSON.stringify(error, null, 2));
          throw error;
        }
        
        console.log('Resposta do Supabase:', data);
        setStatus('success');
        setMessage('Conexão com Supabase estabelecida com sucesso!');
      } catch (err: any) {
        console.error('Erro de conexão:', err);
        setStatus('error');
        setMessage(`Erro ao conectar: ${err.message || err}`);
        setErrorDetails(err.stack || '');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gradient-to-b from-primary/20 to-black">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-4 text-center text-white">Teste de Conexão com Supabase</h1>
        
        <div className={`p-4 rounded-lg mb-4 ${
          status === 'loading' ? 'bg-blue-500/20 border border-blue-500' :
          status === 'success' ? 'bg-green-500/20 border border-green-500' :
          'bg-red-500/20 border border-red-500'
        }`}>
          <div className="flex items-center mb-2">
            {status === 'loading' && (
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
            )}
            {status === 'success' && (
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            <p className="text-lg font-medium">{message}</p>
          </div>
          
          {status === 'error' && errorDetails && (
            <div className="mt-4">
              <p className="font-medium text-red-400">Detalhes do erro:</p>
              <pre className="mt-2 p-3 bg-black/50 rounded text-xs overflow-auto max-h-40 text-red-300">
                {errorDetails}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-white">Informações de debug:</h2>
          
          <div className="space-y-2 text-sm text-gray-300">
            <p><span className="font-semibold">URL do Supabase:</span> {supabaseClient.supabaseUrl}</p>
            <p><span className="font-semibold">Chave anônima:</span> {supabaseClient.supabaseKey ? 'Configurada' : 'Não configurada'}</p>
            <p><span className="font-semibold">Status:</span> {status}</p>
            <p><span className="font-semibold">Variáveis de ambiente carregadas:</span> {import.meta.env.VITE_SUPABASE_URL ? 'Sim' : 'Não'}</p>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-white">Como resolver problemas de conexão:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
              <li>Verifique se as credenciais do Supabase estão corretas no arquivo .env</li>
              <li>Certifique-se de que o Supabase está online e acessível</li>
              <li>Verifique se a tabela "profiles" existe no seu projeto Supabase</li>
              <li>Teste se há bloqueios de rede ou firewall impedindo a conexão</li>
              <li>Verifique as permissões de acesso no Supabase (Row Level Security)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConnection; 
