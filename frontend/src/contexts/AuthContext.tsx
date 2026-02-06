'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'adopter' | 'shelter' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = Cookies.get('access_token');
      if (token) {
        try {
          const response = await api.get('/api/accounts/profile/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await api.post('/api/accounts/login/', { username, password });
    const { access, refresh } = response.data;
    
    Cookies.set('access_token', access);
    Cookies.set('refresh_token', refresh);

    const userResponse = await api.get('/api/accounts/profile/');
    setUser(userResponse.data);
  };

  const register = async (data: any) => {
    const response = await api.post('/api/accounts/register/', data);
    const { tokens, user: userData } = response.data;
    
    Cookies.set('access_token', tokens.access);
    Cookies.set('refresh_token', tokens.refresh);
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
