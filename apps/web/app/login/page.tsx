'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useShcI18n } from '@shc/i18n';
import { useAuth } from '../../lib/useAuth';
import { GourmeatCard, SHCButton, SHCPageHeader } from '../components/SHCWebComponents';

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
      <SHCPageHeader title={t('auth.app_title')} subtitle={t('auth.sign_in_subtitle')} />
      <GourmeatCard className="space-y-4">
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shc-input"
            placeholder={t('auth.email_placeholder')}
            required
            data-testid="login-email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shc-input"
            placeholder={t('auth.password_placeholder')}
            required
            data-testid="login-password"
          />
          {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
          <SHCButton type="submit" appearance="customer" disabled={busy} size="lg" className="w-full min-h-[52px]" testID="login-submit">
            {busy
              ? t('auth.please_wait')
              : mode === 'login'
                ? t('auth.sign_in_btn')
                : t('auth.create_account_btn')}
          </SHCButton>
        </form>
        <button
          type="button"
          className="text-sm text-primary w-full text-center font-bold"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          data-testid="login-mode-toggle"
        >
          {mode === 'login' ? t('auth.toggle_to_register') : t('auth.toggle_to_login')}
        </button>
        <Link
          href="/"
          className="block w-full text-center rounded-xl border border-border bg-secondary py-3 text-sm font-extrabold text-foreground shadow-[var(--shc-shadow-soft)] hover:bg-muted transition-colors"
          data-testid="login-browse-guest"
        >
          {t('auth.browse_guest')}
        </Link>
        <p className="text-xs text-muted-foreground text-center">{t('auth.demo_hint')}</p>
      </GourmeatCard>
    </div>
  );
}
