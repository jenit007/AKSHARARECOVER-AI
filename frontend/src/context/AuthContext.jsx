import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshSession = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      setUser(data?.user || null);
      setAuthError(null);
      return data?.user || null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('akshara:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('akshara:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    setAuthError(null);
    const data = await loginUser(credentials);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    setAuthError(null);
    const data = await registerUser(payload);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Clear local session state even if network error occurs
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('akshara_active_manuscript_id');
        localStorage.removeItem('akshara_active_job_id');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats: user?.stats || null,
        isAuthenticated: Boolean(user),
        loading,
        authError,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
