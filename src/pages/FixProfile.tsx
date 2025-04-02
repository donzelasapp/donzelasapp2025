import React, { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabase';
import { updateAccountType } from '../auth.service';

const FixProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fixProfile = async () => {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        // Buscar perfil com account_type NULL
        const { data: profile, error: fetchError } = await supabaseClient
          .from('profiles')
          .select('id, name, city, account_type')
          .is('account_type', null)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!profile) {
          setSuccess('Nenhum perfil encontrado com account_type NULL');
          return;
        }

        // Atualizar o perfil
        await updateAccountType(profile.id, 'donzela');
        setSuccess(`Perfil ${profile.name} atualizado com sucesso!`);

      } catch (err: any) {
        console.error('Erro:', err);
        setError(err.message || 'Erro ao atualizar perfil');
      } finally {
        setLoading(false);
      }
    };

    fixProfile();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/20 to-black p-4">
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-4">Correção de Perfil</h1>
        
        {loading && (
          <div className="text-white">Processando...</div>
        )}
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-white p-4 rounded-lg mb-4">
            {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default FixProfile; 