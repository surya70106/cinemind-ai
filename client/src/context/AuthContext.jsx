import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function normalizeUser(raw) {
  if (!raw) return null;
  return {
    ...raw,
    id: raw.id || raw._id?.toString?.() || raw._id,
    name: raw.name,
    email: raw.email,
    avatar: raw.avatar,
    createdAt: raw.createdAt,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cinemind_token'));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('cinemind_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data: res } = await api.get('/auth/me');
        // Backend returns: { success: true, data: { user } }
        const currentUser = normalizeUser(res.data?.user || res.user || res.data);
        setUser(currentUser);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('cinemind_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data: res } = await api.post('/auth/login', { email, password });
    // Backend returns: { success: true, data: { token, user } }
    const newToken = res.data?.token || res.token;
    const userData = normalizeUser(res.data?.user || res.user);

    localStorage.setItem('cinemind_token', newToken);
    setToken(newToken);
    setUser(userData);
    return res.data || res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data: res } = await api.post('/auth/register', { name, email, password });
    // Backend returns: { success: true, data: { token, user } }
    const newToken = res.data?.token || res.token;
    const userData = normalizeUser(res.data?.user || res.user);

    localStorage.setItem('cinemind_token', newToken);
    setToken(newToken);
    setUser(userData);
    return res.data || res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cinemind_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
