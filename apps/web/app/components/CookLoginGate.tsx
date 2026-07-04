'use client';

import { useState } from 'react';
import { useCookAuth } from '../../lib/useCookAuth';
import { GourmeatCookHeader, GourmeatPrimaryButton, GourmeatCard } from './SHCWebComponents';

export function CookLoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useCookAuth();
  const [email, setEmail] = useState('rose@shc.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading cook session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <GourmeatCookHeader
          title="Cook sign in"
          subtitle="HDB kitchen · 85% payout · collection-only orders"
          testID="cook-login-hero"
        />
        <GourmeatCard>
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cook@example.com"
              data-testid="cook-login-email"
            />
            <input
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              data-testid="cook-login-password"
            />
            {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
            <GourmeatPrimaryButton
              label={busy ? 'Signing in…' : 'Sign in as cook'}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await login(email, password);
                } catch (e) {
                  setError((e as Error).message || 'Cook login failed');
                } finally {
                  setBusy(false);
                }
              }}
              testID="cook-login-submit"
            />
          </div>
        </GourmeatCard>
      </div>
    );
  }

  return <>{children}</>;
}