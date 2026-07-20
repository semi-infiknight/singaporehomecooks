'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
import { markOnboardingSeen } from '../../lib/onboarding';
import { showDevTools } from '../../lib/dev';
import { SHCButton, SHCCard, SHCPageHeader } from '../components/SHCWebComponents';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [nextPath, setNextPath] = useState('/');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next?.startsWith('/')) setNextPath(next);
  }, []);
  const [email, setEmail] = useState(showDevTools ? 'customer@shc.local' : '');
  const [password, setPassword] = useState(showDevTools ? 'customersecret' : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      markOnboardingSeen();
      router.push(nextPath.startsWith('/') ? nextPath : '/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 shc-safe-bottom-pad" data-testid="auth-screen">
      {/* HomelyEats-style welcome — guest first reduces drop-off */}
      <div
        className="rounded-2xl p-5 mb-6 text-white shadow-[var(--shc-shadow-brutal-sm)]"
        style={{ background: 'var(--shc-gourmeat-primary, #F87048)' }}
      >
        <p className="text-xs font-extrabold opacity-90 mb-1">Singapore Home Cooks</p>
        <h1 className="text-2xl font-black leading-tight">Welcome home</h1>
        <p className="text-sm font-semibold opacity-95 mt-2 leading-relaxed">
          Heritage HDB kitchens, weekly tiffin, and occasion feasts — browse freely, sign in when you’re ready.
        </p>
      </div>

      <SHCPageHeader
        title={mode === 'login' ? 'Sign in' : 'Create account'}
        subtitle="Orders, tiffin, and checkout — or explore as guest below."
      />
      <SHCCard className="p-6 space-y-4">
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shc-input"
            placeholder="Email"
            required
            data-testid="auth-email-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shc-input"
            placeholder="Password"
            required
            data-testid="auth-password-input"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SHCButton type="submit" disabled={busy} size="lg" className="w-full min-h-[52px]" testID="auth-submit-btn">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </SHCButton>
        </form>
        {mode === 'login' ? (
          <button
            type="button"
            className="text-sm text-primary w-full text-center font-bold"
            data-testid="auth-new-here-tour"
            onClick={() => router.push('/onboarding')}
          >
            New here? See how it works
          </button>
        ) : (
          <button
            type="button"
            className="text-sm text-primary w-full text-center font-bold"
            onClick={() => setMode('login')}
          >
            Already have an account? Sign in
          </button>
        )}
        {mode === 'login' && (
          <button
            type="button"
            className="text-sm text-muted-foreground w-full text-center font-bold"
            onClick={() => setMode('register')}
            data-testid="auth-mode-toggle"
          >
            Create an account
          </button>
        )}
        <button
          type="button"
          className="w-full text-center text-sm font-bold text-muted-foreground underline py-2"
          data-testid="auth-browse-guest-btn"
          onClick={() => {
            markOnboardingSeen();
            router.push(nextPath.startsWith('/') ? nextPath : '/');
          }}
        >
          Continue as guest
        </button>
        {showDevTools && (
          <p className="text-xs text-muted-foreground text-center">Demo: customer@shc.local / customersecret</p>
        )}
      </SHCCard>
    </div>
  );
}