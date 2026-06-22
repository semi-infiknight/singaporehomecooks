import { useState, useEffect, useCallback } from 'react';
import {
  clearSession,
  getCurrentUser,
  hydrateSession,
  login as apiLogin,
  logout as apiLogout,
  persistSession,
} from '../lib/api-client';

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

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  return { user, loading, login, logout, isAuthenticated: !!user };
}