'use client';
import { useState, useEffect } from 'react';
import { loginAs, getCurrentUser } from './api-client';

type User = ReturnType<typeof getCurrentUser>;

export function useAuth() {
  const [user, setUser] = useState<User>(getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('shc_web_user');
        if (stored) {
          const p = JSON.parse(stored);
          const u = loginAs(p.role, p.name, {at: p.pdpa_consent_at});
          setUser(u as User);
        }
      } catch {}
      setLoading(false);
    } else setLoading(false);
  }, []);

  const switchRole = (role: 'customer'|'cook', name?: string, pdpa?: any) => {
    const u: any = loginAs(role, name, pdpa);
    setUser(u as User);
    if (typeof window !== 'undefined') localStorage.setItem('shc_web_user', JSON.stringify({role: u.role, name: u.name, pdpa_consent_at: u.pdpa_consent_at}));
    return u;
  };
  const logout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('shc_web_user');
    const u = loginAs('customer');
    setUser(u as User);
  };
  return { user, loading, switchRole, logout, isCook: user.role === 'cook' };
}
