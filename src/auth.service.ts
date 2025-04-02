import { supabaseClient } from './lib/supabase';
import { Profile } from './types/profile';

export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('[AuthService] Iniciando login para:', email);
    
    // Primeiro fazer login
    const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
      password
  });

  if (error) {
      console.error('[AuthService] Erro de autenticação:', error);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos');
      }
      throw new Error('Erro ao fazer login. Tente novamente.');
    }

    if (!data.user || !data.session) {
      console.error('[AuthService] Usuário ou sessão não encontrados');
      throw new Error('Erro ao fazer login. Tente novamente.');
    }

    // Depois buscar o perfil
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('[AuthService] Erro ao buscar perfil:', profileError);
    }

    // Se não encontrar o perfil ou se estiver incompleto, criar/atualizar
    if (!profile || !profile.name || !profile.city || !profile.account_type) {
      console.log('[AuthService] Criando/atualizando perfil para:', data.user.email);
      
      const newProfile = {
        id: data.user.id,
        name: profile?.name || data.user.email.split('@')[0],
        account_type: profile?.account_type || 'plebeu',
        city: profile?.city || 'Sorocaba',
        created_at: profile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: updatedProfile, error: createError } = await supabaseClient
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('[AuthService] Erro ao criar/atualizar perfil:', createError);
        // Retornar apenas user e session se houver erro ao criar perfil
        return { 
          user: data.user, 
          session: data.session,
          profile: null
        };
      }

      console.log('[AuthService] Perfil criado/atualizado:', updatedProfile);
      return { 
        user: data.user, 
        session: data.session, 
        profile: updatedProfile 
      };
    }

    console.log('[AuthService] Login bem sucedido para:', data.user.email);
    return { 
      user: data.user, 
      session: data.session, 
      profile: profile 
    };
  } catch (error: any) {
    console.error('[AuthService] Erro no login:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, phone: string) => {
  try {
    console.log('[AuthService] Iniciando registro para:', email);

    // 1. Verificar se o email já existe
    const { data: existingUser } = await supabaseClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: 'dummy-password'
    });

    if (existingUser?.user) {
      console.error('[AuthService] Email já cadastrado');
      throw new Error('Este email já está cadastrado');
    }

    // 2. Criar o usuário
    const { data, error } = await supabaseClient.auth.signUp({
    email: email.trim().toLowerCase(),
      password,
    options: {
        emailRedirectTo: window.location.origin + '/login'
      }
    });

    if (error) {
      console.error('[AuthService] Erro no registro:', error);
      throw error;
    }
    
    if (!data.user) {
      console.error('[AuthService] Usuário não criado');
      throw new Error('Erro ao criar usuário');
    }

    // 3. Criar perfil básico
    const newProfile = {
      id: data.user.id,
      name: data.user.email.split('@')[0],
      account_type: 'plebeu',
      city: 'Sorocaba',
      phone: phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 4. Inserir ou atualizar o perfil
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert(newProfile, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('[AuthService] Erro ao criar perfil:', profileError);
      throw new Error('Erro ao criar perfil do usuário');
    }

    console.log('[AuthService] Registro e perfil criados com sucesso para:', data.user.email);
    return { user: data.user, session: data.session };
  } catch (error: any) {
    console.error('[AuthService] Erro detalhado no registro:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log('[AuthService] Iniciando logout');
    
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    
    // Limpar storage
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
      window.localStorage.removeItem('sb-auth-token');
      window.localStorage.removeItem('supabase.auth.token');
    }
    
    console.log('[AuthService] Logout completo');
  } catch (error) {
    console.error('[AuthService] Erro no logout:', error);
    throw error;
  }
};

export const getSession = async () => {
  try {
    // Primeiro tentar obter a sessão
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.error('[AuthService] Erro ao obter sessão:', sessionError);
      // Se houver erro de JWT inválido, fazer logout
      if (sessionError.message?.includes('invalid JWT')) {
        console.log('[AuthService] Token inválido, fazendo logout...');
        await signOut();
        window.location.href = '/login'; // Redirecionar para login
        return null;
      }
      throw sessionError;
    }
    
    if (!session) {
      console.log('[AuthService] Nenhuma sessão encontrada');
      return null;
    }
    
    // Verificar se o token ainda é válido
    if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
      console.log('[AuthService] Sessão expirada, fazendo logout...');
      await signOut();
      window.location.href = '/login'; // Redirecionar para login
      return null;
    }

    // Tentar renovar o token
    const { data: { session: refreshedSession }, error: refreshError } = 
      await supabaseClient.auth.refreshSession();

    if (refreshError) {
      console.error('[AuthService] Erro ao renovar sessão:', refreshError);
      await signOut();
      window.location.href = '/login'; // Redirecionar para login
      return null;
    }

    if (!refreshedSession) {
      console.log('[AuthService] Não foi possível renovar a sessão');
      await signOut();
      window.location.href = '/login'; // Redirecionar para login
      return null;
    }
    
    return refreshedSession;
  } catch (error) {
    console.error('[AuthService] Erro inesperado ao obter sessão:', error);
    // Em caso de erro, fazer logout e redirecionar
    await signOut();
    window.location.href = '/login';
    return null;
  }
};

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log('[AuthService] Buscando perfil para:', userId);
    
    if (!userId) {
      console.error('[AuthService] ID do usuário não fornecido');
      return null;
    }

    // Buscar o perfil existente
    const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

    if (profileError) {
      console.error('[AuthService] Erro ao buscar perfil:', profileError);
      // Apenas retornar null em vez de redirecionar
      return null;
    }

    // Se não encontrar o perfil ou se estiver incompleto, criar/atualizar
    if (!profile || !profile.name || !profile.city || !profile.account_type) {
      console.log('[AuthService] Criando/atualizando perfil para:', userId);
      
      const newProfile = {
        id: userId,
        name: profile?.name || userId.split('-')[0], // Usar parte do ID como nome temporário
        account_type: profile?.account_type || 'plebeu',
        city: profile?.city || 'Sorocaba',
        created_at: profile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: updatedProfile, error: createError } = await supabaseClient
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('[AuthService] Erro ao criar/atualizar perfil:', createError);
        // Apenas retornar null em vez de redirecionar
        return null;
      }

      console.log('[AuthService] Perfil criado/atualizado:', updatedProfile);
      return updatedProfile as Profile;
    }

    console.log('[AuthService] Perfil encontrado:', profile);
    return profile as Profile;
  } catch (error) {
    console.error('[AuthService] Erro inesperado ao buscar perfil:', error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    console.log('[AuthService] Atualizando perfil para:', userId);
    
    const { error } = await supabaseClient
    .from('profiles')
      .update(updates)
    .eq('id', userId);

  if (error) throw error;
    
    console.log('[AuthService] Perfil atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('[AuthService] Erro ao atualizar perfil:', error);
    throw error;
  }
};

export const updateAccountType = async (userId: string, accountType: 'donzela' | 'plebeu') => {
  try {
    console.log('[AuthService] Atualizando account_type para:', userId);
    
    const { data, error } = await supabaseClient
      .from('profiles')
      .update({ account_type: accountType })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[AuthService] Erro ao atualizar account_type:', error);
      throw error;
    }

    console.log('[AuthService] account_type atualizado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('[AuthService] Erro ao atualizar account_type:', error);
    throw error;
  }
}; 