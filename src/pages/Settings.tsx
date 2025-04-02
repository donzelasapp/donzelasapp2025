import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { supabaseClient } from '../lib/supabase';
import { Save } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';

// Habilitar HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}

type Settings = {
  age_range: [number, number];
  distance: number;
  notifications: boolean;
  city: string;
};

const Settings = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>({
    age_range: [18, 50],
    distance: 50,
    notifications: true,
    city: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('preferences, city, phone')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setSettings({
            age_range: data.preferences?.age_range || [18, 50],
            distance: data.preferences?.distance || 50,
            notifications: data.preferences?.notifications || true,
            city: data.city || ''
          });

          // Buscar cidades disponíveis se tiver DDD
          if (data.phone) {
            const phoneDigits = data.phone.replace(/\D/g, '');
            if (phoneDigits.length >= 2) {
              fetchCitiesByDDD(phoneDigits.slice(0, 2));
            }
          }
        }
      } catch (error: any) {
        console.error('Erro ao carregar configurações:', error.message);
        setMessage({
          text: 'Erro ao carregar configurações. Tente novamente mais tarde.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

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
    };
    
    if (dddCities[ddd] && dddCities[ddd].length > 0) {
      setAvailableCities(dddCities[ddd]);
    } else {
      setAvailableCities([]);
    }
  };

  const handleChange = (
    field: keyof Settings,
    value: [number, number] | number | boolean | string
  ) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
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
          preferences: {
            age_range: settings.age_range,
            distance: settings.distance,
            notifications: settings.notifications
          },
          city: settings.city,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setMessage({
        text: 'Configurações salvas com sucesso!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error.message);
      setMessage({
        text: 'Erro ao salvar configurações. Tente novamente mais tarde.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-2xl font-display font-bold text-white">Configurações</h1>
          <p className="text-gray-300 mt-1">Ajuste suas preferências de busca</p>
        </header>

        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Faixa etária de interesse
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.age_range[0]}
                  onChange={(e) => handleChange('age_range', [parseInt(e.target.value), settings.age_range[1]])}
                  min={18}
                  max={99}
                  className="w-20 bg-black/50 rounded-lg border border-gray-700 px-2 py-1 text-white text-center"
                />
                <span className="text-gray-400">até</span>
                <input
                  type="number"
                  value={settings.age_range[1]}
                  onChange={(e) => handleChange('age_range', [settings.age_range[0], parseInt(e.target.value)])}
                  min={18}
                  max={99}
                  className="w-20 bg-black/50 rounded-lg border border-gray-700 px-2 py-1 text-white text-center"
                />
                <span className="text-gray-400">anos</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Distância máxima
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  value={settings.distance}
                  onChange={(e) => handleChange('distance', parseInt(e.target.value))}
                  min={1}
                  max={100}
                  className="flex-1"
                />
                <span className="text-white w-16 text-center">
                  {settings.distance}km
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-2 text-gray-200">
                Cidade de busca
              </label>
              {availableCities.length > 0 ? (
                <select
                  id="city"
                  value={settings.city}
                  onChange={(e) => handleChange('city', e.target.value)}
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
                  value={settings.city}
                  disabled
                  className="w-full bg-black/50 rounded-lg border border-gray-700 px-4 py-2 text-white opacity-50 cursor-not-allowed"
                  placeholder="Cidade baseada no seu DDD"
                />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifications"
                checked={settings.notifications}
                onChange={(e) => handleChange('notifications', e.target.checked)}
                className="rounded border-gray-700 bg-black/50 text-primary focus:ring-primary"
              />
              <label htmlFor="notifications" className="text-sm text-gray-400">
                Receber notificações
              </label>
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
                    <span>Salvar Configurações</span>
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

export default Settings; 