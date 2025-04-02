import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { supabaseClient } from '../lib/supabase';

type Profile = {
  id: string;
  name: string | null;
  birthdate: string | null;
  phone: string | null;
  city: string | null;
};

const ProfileSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<Profile>({
    id: '',
    name: '',
    birthdate: '',
    phone: '',
    city: '',
  });

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setFormData({
            id: data.id,
            name: data.name || '',
            birthdate: data.birthdate || '',
            phone: data.phone || '',
            city: data.city || '',
          });
        }
      } catch (error: any) {
        console.error('Erro ao buscar perfil:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      setMessage(null);
      
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          name: formData.name,
          birthdate: formData.birthdate,
          phone: formData.phone,
          city: formData.city,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setMessage({ 
        text: 'Perfil atualizado com sucesso!', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error.message);
      setMessage({ 
        text: `Erro ao atualizar perfil: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-bold">Configurações de Perfil</h1>
      </header>
      
      <div className="bg-gray-900/50 rounded-xl p-6">
        {message && (
          <div 
            className={`${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500 text-green-500' 
                : 'bg-red-500/10 border-red-500 text-red-500'
            } px-4 py-2 rounded-lg mb-4 border`}
          >
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-200">
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white"
            />
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
              onChange={handleChange}
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-200">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white"
            />
          </div>
          
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1 text-gray-200">
              Cidade
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white"
            />
          </div>
          
          <div className="pt-4 flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 btn-primary ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-2 px-4 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Sair
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings; 
