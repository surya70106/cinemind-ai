import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, assertSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

function normalizeUser(supaUser) {
  if (!supaUser) return null;
  return {
    id: supaUser.id,
    email: supaUser.email,
    name: supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
    avatar: supaUser.user_metadata?.avatar || '',
    createdAt: supaUser.created_at,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      assertSupabaseConfigured();
    } catch {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(normalizeUser(session?.user ?? null));
      setLoading(false);
    }).catch(() => setLoading(false));

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(normalizeUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    assertSupabaseConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    assertSupabaseConfigured();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    assertSupabaseConfigured();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
