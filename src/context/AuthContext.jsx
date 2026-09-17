import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../services/supabase';

const AuthContext = createContext();


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [supabaseError, setSupabaseError] = useState('');

  // Carrega usuário e lista de perfis iniciais com Logs de Depuração
  useEffect(() => {
    console.log('[DEBUG AUTH] Inicializando AuthProvider. Supabase Configurado:', isSupabaseConfigured);
    
    if (isSupabaseConfigured) {
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          console.log('[DEBUG AUTH] getSession() retornou session:', session ? 'Sim' : 'Não');
          if (session) {
            fetchUserProfile(session.user);
          } else {
            setUser(null);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('[DEBUG AUTH] Erro ao recuperar sessão inicial Supabase:', err);
          setUser(null);
          setLoading(false);
          setSupabaseError('Não foi possível conectar ao Supabase. Verifique a configuração e tente novamente.');
        });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`[DEBUG AUTH] onAuthStateChange acionado. Evento: ${event}. Session:`, session ? 'Sim' : 'Não');
        if (session) {
          fetchUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      console.error('[DEBUG AUTH] Supabase não configurado corretamente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      setSupabaseError('Supabase não configurado corretamente. Verifique as variáveis de ambiente.');
      setLoading(false);
    }
  }, []);

  const refreshProfiles = () => {
    if (isSupabaseConfigured) {
      fetchSupabaseProfiles();
    }
  };

  const fetchSupabaseProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) {
        setProfiles(data);
      } else {
        throw error || new Error('Falha desconhecida ao buscar perfis.');
      }
    } catch (e) {
      console.error('[DEBUG AUTH] Erro ao buscar lista de perfis do Supabase:', e);
      setSupabaseError('Falha ao carregar perfis no Supabase. Verifique a configuração e tente novamente.');
      setProfiles([]);
    }
  };

  // Busca perfil associado no Supabase para o usuário logado
  const fetchUserProfile = async (authUser) => {
    console.log('[DEBUG AUTH] Carregando perfil do profiles para o ID:', authUser.id);
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.warn('[DEBUG AUTH] profiles.select retornou erro:', error);
        throw error;
      }

      if (!data) {
        console.warn('[DEBUG AUTH] Perfil não encontrado; criando perfil fallback para:', authUser.id);
        data = {
          id: authUser.id,
          nome: authUser.user_metadata?.nome || authUser.email || 'Novo Corretor',
          email: authUser.email,
          role: authUser.user_metadata?.role || 'corretor',
          ativo: true
        };

        const { error: insertError } = await supabase.from('profiles').insert(data);
        if (insertError) {
          console.error('[DEBUG AUTH] Erro ao criar perfil fallback:', insertError);
          throw insertError;
        }
      }

      if (!data) {
        throw new Error('Perfil não encontrado no Supabase.');
      }

      console.log('[DEBUG AUTH] Perfil obtido com sucesso do banco:', data);

      const sessionUser = {
        id: authUser.id,
        email: authUser.email,
        nome: data.nome,
        role: data.role,
        ativo: data.ativo,
        telefone: data.telefone || '',
        avatar_url: data.avatar_url || '',
        whatsapp_configured: data.whatsapp_configured || false
      };

      console.log('[DEBUG AUTH] setUser ativo:', sessionUser);
      setUser(sessionUser);
      fetchSupabaseProfiles();
      return true;
    } catch (err) {
      console.error('[DEBUG AUTH] Erro ao obter perfil no Supabase:', err);
      setUser(null);
      setSupabaseError('Não foi possível carregar seu perfil no Supabase. Verifique suas credenciais e tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Método de Login
  const login = async (emailInput, passwordInput = '') => {
    console.log('[DEBUG AUTH] Tentativa de Login iniciada para o e-mail:', emailInput);
    setLoading(true);
    const emailVal = emailInput.trim().toLowerCase();
    const passwordVal = passwordInput.trim();

    if (!isSupabaseConfigured || !supabase) {
      const errorMessage = 'Supabase não configurado corretamente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
      console.error('[DEBUG AUTH] Tentativa de login sem Supabase configurado');
      setSupabaseError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }

    try {
      console.log('[DEBUG AUTH] Efetuando signInWithPassword no Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailVal,
        password: passwordVal
      });
      if (error) {
        console.error('[DEBUG AUTH] signInWithPassword retornou erro do Supabase:', error);
        throw error;
      }

      const authUser = data?.user || data?.session?.user;
      if (!authUser) {
        throw new Error('Falha ao obter dados do usuário após login.');
      }

      console.log('[DEBUG AUTH] signInWithPassword concluído com sucesso. Usuário:', authUser.email);
      const profileLoaded = await fetchUserProfile(authUser);
      if (!profileLoaded) {
        return { success: false, error: 'Perfil do usuário não foi encontrado no Supabase.' };
      }
      return { success: true, user: authUser };
    } catch (err) {
      console.error('[DEBUG AUTH] Falha na chamada de login:', err.message || err);
      setSupabaseError('Erro ao efetuar login no Supabase. Verifique credenciais e configuração.');
      setLoading(false);
      return { success: false, error: err.message || 'Erro no login.' };
    }
  };

  // Método de Logout
  const logout = async () => {
    console.log('[DEBUG AUTH] Efetuando logout...');
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[DEBUG AUTH] Erro no signOut:', err);
    }
    setUser(null);
    setLoading(false);
  };

  const addProfile = async (profileData) => {
    console.log('[DEBUG AUTH] Criando usuário no Supabase Auth via cliente secundário:', profileData.email);
    
    const secondarySupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    let createdUserId = null;
    let authError = null;

    try {
      const { data, error } = await secondarySupabase.auth.signUp({
        email: profileData.email,
        password: profileData.senha || 'Senhaimprovavel@12321',
        options: {
          data: {
            nome: profileData.nome,
            role: profileData.role
          }
        }
      });

      if (error) {
        authError = error;
        console.error('[DEBUG AUTH] Erro no Supabase signUp:', error);
      } else if (data?.user?.id) {
        createdUserId = data.user.id;
      }
    } catch (err) {
      authError = err;
    }

    // Traduz e trata erros de cadastro de Auth
    if (authError) {
      const errMsg = authError.message || String(authError);
      if (errMsg.includes('rate_limit') || authError.status === 429) {
        throw new Error('O limite de envios de e-mail do Supabase foi excedido. No painel do Supabase (Auth > Settings), desative a confirmação de e-mail obrigatória ("Confirm Email") para permitir cadastros instantâneos.');
      }
      if (errMsg.includes('already registered') || errMsg.includes('already exists')) {
        throw new Error('Este endereço de e-mail já está cadastrado no sistema.');
      }
      if (errMsg.includes('invalid') && errMsg.includes('email')) {
        throw new Error('O e-mail informado é inválido ou foi recusado pelo Supabase.');
      }
      throw new Error(`Erro ao criar conta no Supabase: ${errMsg}`);
    }

    if (createdUserId) {
      const newProfile = {
        id: createdUserId,
        nome: profileData.nome,
        email: profileData.email,
        role: profileData.role,
        ativo: profileData.ativo !== false
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(newProfile);

      if (upsertError) {
        console.error('[DEBUG AUTH] Erro ao gravar perfil no banco profiles:', upsertError);
      }

      setProfiles(prev => {
        const filtered = prev.filter(p => p.id !== createdUserId && p.email !== profileData.email);
        return [...filtered, newProfile];
      });
    }

    fetchSupabaseProfiles();
    
    return {
      id: createdUserId,
      nome: profileData.nome,
      email: profileData.email,
      role: profileData.role,
      ativo: true
    };
  };

  const updateProfile = async (id, profileData) => {
    const { data, error } = await supabase.from('profiles').update(profileData).eq('id', id).select();
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('Não autorizado: verifique se executou o script SQL de atualização (update_schema_v13.sql) no painel do Supabase.');
    }
    
    if (user && id === user.id) {
      setUser(prev => {
        const updated = { ...prev, ...profileData };
        console.log('[DEBUG AUTH] setUser atualizado localmente:', updated);
        return updated;
      });
    }

    refreshProfiles();
    return data[0];
  };

  const deleteProfile = async (id) => {
    if (id === 'admin-id' || id === user?.id) {
      throw new Error('Não é possível excluir a sua própria conta ou o Administrador Geral padrão.');
    }

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
    refreshProfiles();
    return true;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) throw error;
    return true;
  };

  const value = {
    user,
    loading,
    profiles,
    login,
    logout,
    addProfile,
    updateProfile,
    deleteProfile,
    isGerente: user?.role === 'gerente' || user?.role === 'master',
    isMaster: user?.role === 'master',
    isCorretor: user?.role === 'corretor' || user?.role === 'gerente' || user?.role === 'master',
    supabaseError,
    isSupabaseConfigured,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
