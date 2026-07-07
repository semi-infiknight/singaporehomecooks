'use client';

import { useState } from 'react';
import { useCookAuth } from '../../lib/useCookAuth';
import { GourmeatCookHeader, GourmeatPrimaryButton, GourmeatCard } from './SHCWebComponents';
import { useShcI18n, getCookAuthCopy } from '@shc/i18n';

export function CookLoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useCookAuth();
  const { locale } = useShcI18n();
  const auth = getCookAuthCopy(locale);
  const [email, setEmail] = useState('rose@shc.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        {auth.loadingSession}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <GourmeatCookHeader
          title={auth.signInTitle}
          subtitle={auth.portalSubtitle}
          testID="cook-login-hero"
        />
        <GourmeatCard>
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={auth.emailPlaceholder}
              data-testid="cook-login-email"
            />
            <input
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={auth.passwordPlaceholder}
              data-testid="cook-login-password"
            />
            {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
            <GourmeatPrimaryButton
              label={busy ? auth.signingIn : auth.signInBtn}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await login(email, password);
                } catch (e) {
                  setError((e as Error).message || auth.loginFailed);
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
