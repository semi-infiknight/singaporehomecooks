'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
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
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    return u;
  }, [queryClient]);

  const register = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await apiRegister(email, password);
    await persistSession(token, u);
    setUser(u);
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    return u;
  }, [queryClient]);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}