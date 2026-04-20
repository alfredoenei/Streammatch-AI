import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface ITasteProfile {
  genres: string[];
  pace: 'frenetic' | 'balanced' | 'slow';
  tone: 'commercial' | 'indie' | 'balanced';
  era: 'classics' | '80s-90s' | '2000s' | 'modern';
  dealbreakers: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  streamingPlatforms: string[];
  watchedMovies: number[];
  tasteProfile?: ITasteProfile; // v10.0
  hasCompletedOnboarding?: boolean; // v10.0
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, streamingPlatforms: string[]) => Promise<void>;
  updateTasteProfile: (profile: ITasteProfile) => Promise<void>; // v10.0
  resetTasteProfile: () => Promise<void>; // v10.0
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const response = await api.get('/auth/profile');
        
        // v17.1: Validación de cabecera Content-Type para evitar parsear HTML como JSON
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
        // Si el error es de parsing o red, no crasheamos la app, solo cerramos sesión
        logout();
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user, token } = response.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
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
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al registrar usuario');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
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
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar perfil de paladar');
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
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al reiniciar perfil');
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
      updateTasteProfile, // v10.0
      resetTasteProfile, // v10.0
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
