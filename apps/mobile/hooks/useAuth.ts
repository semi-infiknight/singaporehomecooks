// hooks/useAuth.ts
// Basic auth mock per 07-auth.md + SecureStore ready. Dev switcher customer/cook.
// In production: real JWT + refresh, biometric optional.
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginAs, getCurrentUser } from '../lib/api-client';

type CurrentUser = ReturnType<typeof getCurrentUser>;

export function useAuth() {
  const [user, setUser] = useState<CurrentUser>(getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('shc_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const logged = loginAs(parsed.role, parsed.name);
          setUser(logged as CurrentUser);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const switchRole = async (role: 'customer' | 'cook', name?: string, pdpaConsent?: { at?: string; version?: string }) => {
    const u = loginAs(role, name, pdpaConsent);
    setUser(u);
    await SecureStore.setItemAsync('shc_user', JSON.stringify({ role: u.role, name: u.name, pdpa_consent_at: u.pdpa_consent_at }));
    return u;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('shc_user');
    // reset to customer default
    const u = loginAs('customer');
    setUser(u);
  };

  return { user, loading, switchRole, logout, isCook: user.role === 'cook' };
}