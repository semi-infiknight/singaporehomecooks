import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  clearSession,
  getCurrentUser,
  hydrateSession,
  login as apiLogin,
  logout as apiLogout,
  persistSession,
  register as apiRegister,
} from '../lib/api-client';

type CurrentUser = ReturnType<typeof getCurrentUser>;

export function useAuth() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await hydrateSession();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await apiLogin(email, password);
    await persistSession(token, u);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { token, user: u } = await apiRegister(email, password, firstName, lastName);
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