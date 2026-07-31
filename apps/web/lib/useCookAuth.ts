'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  clearCookSession,
  getCookUser,
  hydrateCookSession,
  loginCook,
  persistCookSession,
  registerCook,
} from './cook-api-client';

type CookUser = ReturnType<typeof getCookUser>;

export function useCookAuth() {
  const [user, setUser] = useState<CookUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrateCookSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await loginCook(email, password);
    await persistCookSession(token, u);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string, area?: string, story?: string) => {
      const { token, user: u } = await registerCook(email, password, displayName, area, story);
      await persistCookSession(token, u);
      setUser(u);
      return u;
    },
    []
  );

  const logout = useCallback(async () => {
    await clearCookSession();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}