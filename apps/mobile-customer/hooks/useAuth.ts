import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  clearSession,
  getCurrentUser,
  hydrateSession,
  login as apiLogin,
  persistSession,
  register as apiRegister,
} from '../lib/api-client';

type CurrentUser = ReturnType<typeof getCurrentUser>;

function scheduleCustomerPushRegistration() {
  void import('../lib/push')
    .then(({ registerCustomerPushToken }) => registerCustomerPushToken())
    .catch(() => null);
}

export function useAuth() {
  const queryClient = useQueryClient();
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
    scheduleCustomerPushRegistration();
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    await queryClient.invalidateQueries({ queryKey: ['credits'] });
    return u;
  }, [queryClient]);

  const register = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { token, user: u } = await apiRegister(email, password, firstName, lastName);
    await persistSession(token, u);
    setUser(u);
    scheduleCustomerPushRegistration();
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    await queryClient.invalidateQueries({ queryKey: ['credits'] });
    return u;
  }, [queryClient]);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
    queryClient.removeQueries({ queryKey: ['cart'] });
    queryClient.removeQueries({ queryKey: ['orders'] });
    queryClient.removeQueries({ queryKey: ['credits'] });
  }, [queryClient]);

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}