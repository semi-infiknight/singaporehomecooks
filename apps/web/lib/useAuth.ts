'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  clearSession,
  getCurrentUser,
  hydrateSession,
  login as apiLogin,
  logout as apiLogout,
  persistSession,
  register as apiRegister,
} from './api-client';

type User = ReturnType<typeof getCurrentUser>;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrateSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await apiLogin(email, password);
    await persistSession(token, u);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await apiRegister(email, password);
    await persistSession(token, u);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}