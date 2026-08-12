import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  clearSession,
  getCurrentUser,
  hydrateSession,
  login as apiLogin,
  register as apiRegister,
  persistSession,
} from '../lib/api-client';
import { clearCookOnboardingSeen } from '../lib/onboarding';

type CurrentUser = ReturnType<typeof getCurrentUser>;

const TOKEN_KEY = 'shc_cook_token';

type AuthContextValue = {
  user: CurrentUser;
  loading: boolean;
  login: (email: string, password: string) => Promise<NonNullable<CurrentUser>>;
  register: (
    email: string,
    password: string,
    mobile: string,
    whatsappOtp: string,
    display_name?: string,
    area?: string,
    story?: string
  ) => Promise<NonNullable<CurrentUser>>;
  /** Re-read /auth/me into session (picks up kitchen display_name after onboarding). */
  refreshUser: () => Promise<CurrentUser>;
  /** Patch local session user fields (e.g. name) and persist. */
  setSessionUser: (patch: Partial<NonNullable<CurrentUser>>) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function scheduleCookPushRegistration(cookId: string) {
  void import('../lib/push')
    .then(({ registerCookPushToken }) => registerCookPushToken(cookId))
    .catch(() => null);
}

/** Single shared session for cook app — required so logout/login update the root gate. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await hydrateSession();
      if (cancelled) return;
      setUser(u);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await apiLogin(email, password);
    await persistSession(token, u);
    setUser(u);
    if (u?.id) scheduleCookPushRegistration(u.id);
    return u;
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      mobile: string,
      whatsappOtp: string,
      display_name?: string,
      area?: string,
      story?: string
    ) => {
      const { token, user: u } = await apiRegister(
        email,
        password,
        mobile,
        whatsappOtp,
        display_name,
        area,
        story
      );
      await persistSession(token, u);
      await clearCookOnboardingSeen();
      setUser(u);
      if (u?.id) scheduleCookPushRegistration(u.id);
      return u;
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const u = await hydrateSession();
    setUser(u);
    return u;
  }, []);

  const setSessionUser = useCallback(async (patch: Partial<NonNullable<CurrentUser>>) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const prev = user;
    if (!prev || !token) return prev;
    const next = { ...prev, ...patch };
    await persistSession(token, next);
    setUser(next);
    return next;
  }, [user]);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      refreshUser,
      setSessionUser,
      logout,
      isAuthenticated: !!user,
    }),
    [user, loading, login, register, refreshUser, setSessionUser, logout]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
