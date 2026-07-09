'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
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
    <div className="max-w-md mx-auto px-4 py-10 pb-28" data-testid="web-onboarding-login">
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
        subtitle="Orders, tiffin, credits, and checkout — or explore as guest below."
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
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shc-input"
            placeholder="Password"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SHCButton type="submit" disabled={busy} size="lg" className="w-full min-h-[52px]" testID="web-signin-cta">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </SHCButton>
        </form>
        <button
          type="button"
          className="text-sm text-primary w-full text-center font-bold"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
        <button
          type="button"
          className="w-full text-center text-sm font-bold text-muted-foreground underline py-2"
          data-testid="onboarding-guest-btn"
          onClick={() => router.push(nextPath.startsWith('/') ? nextPath : '/')}
        >
          Continue as guest
        </button>
        <p className="text-xs text-muted-foreground text-center">Demo: customer@shc.local / customersecret</p>
      </SHCCard>
    </div>
  );
}