import { useState, useEffect, useCallback } from 'react';
import {
  clearSession,
  getCurrentUser,
  hydrateSession,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  persistSession,
} from '../lib/api-client';
import { clearCookOnboardingSeen } from '../lib/onboarding';

type CurrentUser = ReturnType<typeof getCurrentUser>;

function scheduleCookPushRegistration(cookId: string) {
  void import('../lib/push')
    .then(({ registerCookPushToken }) => registerCookPushToken(cookId))
    .catch(() => null);
}

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
    if (u?.id) scheduleCookPushRegistration(u.id);
    return u;
  }, []);

  const register = useCallback(
    async (email: string, password: string, display_name: string, area: string, story?: string) => {
      const { token, user: u } = await apiRegister(email, password, display_name, area, story);
      await persistSession(token, u);
      await clearCookOnboardingSeen();
      setUser(u);
      if (u?.id) scheduleCookPushRegistration(u.id);
      return u;
    },
    []
  );

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}