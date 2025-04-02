import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from './lib/supabase';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
  getSession,
  getUserProfile,
  updateProfile
} from './auth.service';
import { Profile } from './types/profile';

// Tempo de inatividade: 10 minutos
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  userProfile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, phone: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: any) => void;
  saveUserProfile: (userId: string, profileData: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Referência para o timer de inatividade
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Função para resetar o timer de inatividade
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (user) {
      timerRef.current = setTimeout(() => {
        // Logout por inatividade
        handleSignOut();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);

  // Função para buscar o perfil do usuário
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('[Auth] Buscando perfil do usuário:', userId);
      const profile = await getUserProfile(userId);
      
      if (!profile) {
        console.error('[Auth] Perfil não encontrado');
        return null;
      }
      
      console.log('[Auth] Perfil encontrado:', profile);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('[Auth] Erro ao buscar perfil:', error);
      return null;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[Auth] Iniciando logout...');
      
      // Limpar timer de inatividade
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      await authSignOut();
      setUser(null);
      setUserProfile(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[Auth] Erro no logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Efeito para monitorar atividade do usuário
  useEffect(() => {
    if (!user) return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimer();
    };
    
    // Adicionar listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Iniciar timer
    resetTimer();
    
    // Limpar listeners e timer
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, resetTimer]);

  // Inicialização do estado de autenticação
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('[Auth] Iniciando autenticação...');
        
        // Verificar a sessão atual
        const session = await getSession();
        
        if (session?.user && mounted) {
          console.log('[Auth] Sessão encontrada para:', session.user.email);
          setUser(session.user);
          
          // Buscar perfil na inicialização
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUserProfile(profile);
          }
        } else {
          console.log('[Auth] Nenhuma sessão encontrada');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('[Auth] Erro na inicialização:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Evento de autenticação:', event, session);
      
      if (mounted) {
        if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
          try {
            // Buscar perfil no evento de autenticação
            const { data: profileCheck, error: profileError } = await supabaseClient
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('[Auth] Erro ao buscar perfil:', profileError);
              // Mesmo com erro, manter o usuário na home se já estiver autenticado
              if (location.pathname === '/login') {
                navigate('/home', { replace: true });
              }
            } else if (profileCheck) {
              setUserProfile(profileCheck);
              if (location.pathname === '/login') {
        navigate('/home', { replace: true });
              }
            } else {
              // Se não houver perfil, redirecionar para registro apenas se estiver na tela de login
              if (location.pathname === '/login') {
                navigate('/register', { replace: true });
              }
            }
          } catch (error) {
            console.error('[Auth] Erro ao processar autenticação:', error);
            // Manter o usuário onde está em caso de erro
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setUserProfile(null);
        navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('[Auth] Tentando login para:', email);
      const result = await signInWithEmail(email, password);
      
      if (result.user) {
        setUser(result.user);
        if (result.profile) {
          setUserProfile(result.profile);
          navigate('/home', { replace: true });
        } else {
          navigate('/register', { replace: true });
        }
      }
      
      return result;
    } catch (error) {
      console.error('[Auth] Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, phone: string) => {
    try {
      setLoading(true);
      console.log('[Auth] Tentando registro para:', email);
      const result = await signUpWithEmail(email, password, phone);
      setUser(result.user);
      return result;
    } catch (error: any) {
      console.error('[Auth] Erro no registro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar o perfil no estado
  const updateUserProfile = (profile: any) => {
    setUserProfile(prev => ({
      ...prev,
      ...profile
    }));
  };

  // Função para salvar o perfil no banco
  const saveUserProfile = async (userId: string, profileData: any) => {
    try {
      console.log('Salvando perfil do usuário:', userId, profileData);

      if (!userId) {
        throw new Error('ID do usuário não encontrado');
      }

      // Validar account_type
      if (profileData.account_type && !['donzela', 'plebeu'].includes(profileData.account_type.toLowerCase())) {
        throw new Error('Valor inválido para account_type. Use "donzela" ou "plebeu"');
      }

      const newProfile = {
        id: userId,
        name: profileData.name,
        account_type: profileData.account_type.toLowerCase(),
        city: profileData.city,
        birthdate: profileData.birthdate || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar perfil:', error);
        throw error;
      }

      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    updateUserProfile,
    saveUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 