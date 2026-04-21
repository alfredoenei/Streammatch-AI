import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';
import type { User, ITasteProfile, AuthContextType } from '../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  }, []);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const response = await api.get('/auth/profile');
        
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          throw new Error('La API devolvió HTML en lugar de JSON (Probable fallo de servidor/proxy)');
        }

        if (response.data && response.data.success) {
          setUser(response.data.data);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (error) {
        console.error('🔴 [Auth Resilience] Error validando sesión:', error);
        logout();
      }
    }
    setIsLoading(false);
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user, token } = response.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
      }
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, streamingPlatforms: string[]) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, streamingPlatforms });
      if (response.data.success) {
        const { user, token } = response.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Error al registrar usuario');
      }
      throw error;
    }
  };

  const updateTasteProfile = async (tasteProfile: ITasteProfile) => {
    try {
      const response = await api.post('/users/profile/taste', { tasteProfile });
      if (response.data.success) {
        const { tasteProfile: savedProfile, hasCompletedOnboarding } = response.data.data;
        setUser(prev => prev ? { 
          ...prev, 
          tasteProfile: savedProfile, 
          hasCompletedOnboarding 
        } : null);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Error al actualizar perfil de paladar');
      }
      throw error;
    }
  };

  const resetTasteProfile = async () => {
    try {
      const response = await api.post('/users/profile/reset');
      if (response.data.success) {
        setUser(prev => prev ? { 
          ...prev, 
          tasteProfile: undefined, 
          hasCompletedOnboarding: false 
        } : null);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Error al reiniciar perfil');
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      token, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      register, 
      updateTasteProfile, 
      resetTasteProfile, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
