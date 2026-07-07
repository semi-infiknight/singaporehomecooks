'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShcI18n } from '@shc/i18n';
import { useAuth } from '../../lib/useAuth';
import { SHCButton, SHCCard, SHCPageHeader } from '../components/SHCWebComponents';

export default function LoginPage() {
  const { t } = useShcI18n();
  const { login, register } = useAuth();
  const router = useRouter();
  const [nextPath, setNextPath] = useState('/');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next?.startsWith('/')) setNextPath(next);
  }, []);
  const [email, setEmail] = useState('customer@shc.local');
  const [password, setPassword] = useState('customersecret');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      router.push(nextPath.startsWith('/') ? nextPath : '/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <SHCPageHeader title={t('auth.sign_in_title')} subtitle={t('auth.sign_in_subtitle_web')} />
      <SHCCard className="p-6 space-y-4">
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shc-input"
            placeholder={t('auth.email_placeholder')}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shc-input"
            placeholder={t('auth.password_placeholder')}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SHCButton type="submit" disabled={busy} size="lg" className="w-full min-h-[52px]">
            {busy
              ? t('auth.please_wait')
              : mode === 'login'
                ? t('auth.sign_in_btn')
                : t('auth.create_account_btn')}
          </SHCButton>
        </form>
        <button
          type="button"
          className="text-sm text-primary w-full text-center"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? t('auth.toggle_to_register') : t('auth.toggle_to_login')}
        </button>
        <p className="text-xs text-muted-foreground text-center">{t('auth.demo_hint')}</p>
      </SHCCard>
    </div>
  );
}
