'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, getMe, refreshToken } from '@/lib/api';

// DECISIÓN: Se usa Context API en lugar de una librería externa para mantener dependencias mínimas

interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  phone: string;
  credit_balance: number;
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // DECISIÓN: Restaurar sesión desde localStorage al montar
    const storedToken = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');

    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken).catch(async () => {
        // Token expirado, intentar refresh
        if (storedRefresh) {
          try {
            const data = await refreshToken(storedRefresh);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            setToken(data.access);
            await fetchUser(data.access);
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchUser(accessToken: string) {
    try {
      const userData = await getMe(accessToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }

  function clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }

  async function handleLogin(email: string, password: string) {
    const data = await apiLogin(email, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setToken(data.access);
    await fetchUser(data.access);
  }

  function handleLogout() {
    clearSession();
  }

  async function refreshUser() {
    if (token) {
      await fetchUser(token);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
