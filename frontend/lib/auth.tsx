'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  phone?: string;
  level?: string;
  institution?: string;
  enrolledBatches?: string[];
};

type Ctx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: null,
  token: null,
  loading: true,
  login: async () => null as any,
  register: async () => null as any,
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (t: string | null, u: User | null) => {
    setToken(t);
    setUser(u);
    if (typeof window !== 'undefined') {
      if (t) localStorage.setItem('tea_token', t);
      else localStorage.removeItem('tea_token');
      if (u) localStorage.setItem('tea_user', JSON.stringify(u));
      else localStorage.removeItem('tea_user');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem('tea_token');
    const u = localStorage.getItem('tea_user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const me = await api<User>('/users/me', { token });
      persist(token, me);
    } catch (_) {
      persist(null, null);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    persist(r.token, r.user);
    return r.user;
  };

  const register = async (data: any) => {
    const r = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    persist(r.token, r.user);
    return r.user;
  };

  const logout = () => persist(null, null);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
