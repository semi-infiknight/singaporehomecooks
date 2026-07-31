'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { validateShcPassword } from '@shc/utils';
import { useCookAuth } from '../../lib/useCookAuth';
import { hasSeenCookOnboarding, clearCookOnboardingSeen } from '../../lib/onboarding';
import { GourmeatCookHeader, GourmeatPrimaryButton, GourmeatCard } from './SHCWebComponents';
import { showDevTools } from '../../lib/dev';

/**
 * Cook PWA auth + first-run kitchen onboarding.
 * After sign-in or sign-up, unseen cooks → `/cook-portal/onboarding` (not dashboard).
 */
export function CookLoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login, register } = useCookAuth();
  const pathname = usePathname() || '';
  const router = useRouter();
  const [email, setEmail] = useState(showDevTools ? 'rose@shc.local' : '');
  const [password, setPassword] = useState(showDevTools ? 'cooksecret' : '');
  const [displayName, setDisplayName] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const isOnboardingPath = pathname.startsWith('/cook-portal/onboarding');

  useEffect(() => {
    if (loading || !user) {
      setOnboardingReady(false);
      return;
    }
    const seen = hasSeenCookOnboarding();
    setNeedsOnboarding(!seen);
    setOnboardingReady(true);
    if (!seen && !isOnboardingPath) {
      router.replace('/cook-portal/onboarding');
    }
  }, [loading, user, isOnboardingPath, router]);

  const submit = async () => {
    setBusy(true);
    setError('');
    const trimmedEmail = email.trim();
    const policy = validateShcPassword(password);
    if (!policy.ok) {
      setError(policy.message);
      setBusy(false);
      return;
    }
    if (mode === 'register' && (!displayName.trim() || !area.trim())) {
      setError('Add your kitchen name and HDB area.');
      setBusy(false);
      return;
    }
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
      } else {
        await register(trimmedEmail, password, displayName.trim(), area.trim());
        clearCookOnboardingSeen();
      }
    } catch (e) {
      setError((e as Error).message || (mode === 'login' ? 'Cook login failed' : 'Sign up failed'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading cook session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8" data-testid="cook-login-screen">
        <GourmeatCookHeader
          title={mode === 'login' ? 'Cook sign in' : 'Create cook account'}
          subtitle="HDB kitchen · collection-only orders"
          testID="cook-login-hero"
        />

        <div
          className="rounded-2xl p-4 mb-4 text-white shadow-[var(--shc-shadow-brutal-sm)]"
          style={{ background: 'var(--shc-gourmeat-primary, #F87048)' }}
        >
          <p className="font-black text-lg">{mode === 'login' ? 'Welcome back' : 'New home cook?'}</p>
          <p className="text-sm font-semibold opacity-95 mt-1">
            {mode === 'login'
              ? 'Sign in to manage listings, orders, and earnings.'
              : 'Create a fresh kitchen account — no demo data. List dishes customers can book.'}
          </p>
        </div>

        <GourmeatCard>
          <div className="space-y-3">
            {mode === 'register' && (
              <>
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Kitchen / display name"
                  data-testid="cook-register-display-name"
                />
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="HDB area (e.g. Tampines)"
                  data-testid="cook-register-area"
                />
              </>
            )}
            <input
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              data-testid="cook-login-email"
            />
            <input
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Password (8+ chars, letter + number in prod)' : 'Password'}
              data-testid="cook-login-password"
            />
            {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
            <GourmeatPrimaryButton
              label={
                busy
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Sign in as cook'
                    : 'Create cook account'
              }
              disabled={busy}
              onClick={submit}
              testID="cook-login-submit"
            />
            <button
              type="button"
              className="w-full text-center text-sm font-bold text-primary py-2"
              data-testid="cook-auth-mode-toggle"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'New home cook? Create an account' : 'Have an account? Sign in'}
            </button>
            {showDevTools && mode === 'login' && (
              <p className="text-xs text-muted-foreground text-center">
                Staging demo: rose@shc.local / cooksecret (docs only — not for production sign-up)
              </p>
            )}
          </div>
        </GourmeatCard>
      </div>
    );
  }

  if (!onboardingReady || (needsOnboarding && !isOnboardingPath)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Preparing kitchen setup…
      </div>
    );
  }

  return <>{children}</>;
}
