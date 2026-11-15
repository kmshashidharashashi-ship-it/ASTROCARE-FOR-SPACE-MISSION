import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('astrocare_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Invalid user cache:', e);
      localStorage.removeItem('astrocare_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('astrocare_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('astrocare_user', JSON.stringify(res.data));
        } catch (err) {
          // Fallback to existing user data if offline
          console.warn('Could not refresh profile from server, using cached session');
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('astrocare_token', access_token);
    localStorage.setItem('astrocare_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    // After register, automatically log in
    return await login(payload.email, payload.password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('astrocare_token');
    localStorage.removeItem('astrocare_user');
  };

  // Demo role switcher helper
  const setDemoRole = (role) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('astrocare_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        setDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
