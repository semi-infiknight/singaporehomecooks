'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCookAuth } from '../../lib/useCookAuth';
import { hasSeenCookOnboarding, clearCookOnboardingSeen } from '../../lib/onboarding';
import { GourmeatCookHeader, GourmeatPrimaryButton, GourmeatCard } from './SHCWebComponents';

/**
 * Cook PWA auth + first-run kitchen onboarding.
 * After sign-in, unseen cooks → `/cook-portal/onboarding` (not dashboard).
 */
export function CookLoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useCookAuth();
  const pathname = usePathname() || '';
  const router = useRouter();
  const [email, setEmail] = useState('rose@shc.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'register-hint'>('login');
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
          title="Cook sign in"
          subtitle="HDB kitchen · collection-only orders"
          testID="cook-login-hero"
        />

        <div
          className="rounded-2xl p-4 mb-4 text-white shadow-[var(--shc-shadow-brutal-sm)]"
          style={{ background: 'var(--shc-gourmeat-primary, #F87048)' }}
        >
          <p className="font-black text-lg">New home cook?</p>
          <p className="text-sm font-semibold opacity-95 mt-1">
            Sign in with your cook account — then a short kitchen setup tour (story, collection, PDPA).
          </p>
        </div>

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
                  // First-time tour after login unless already completed on this browser
                  await login(email, password);
                } catch (e) {
                  setError((e as Error).message || 'Cook login failed');
                } finally {
                  setBusy(false);
                }
              }}
              testID="cook-login-submit"
            />
            <button
              type="button"
              className="w-full text-center text-sm font-bold text-primary py-2"
              data-testid="cook-new-here-tour"
              onClick={() => {
                // Force tour after next successful login
                clearCookOnboardingSeen();
                setMode('register-hint');
                setError('');
              }}
            >
              New here? I’ll take the kitchen tour after sign-in
            </button>
            {mode === 'register-hint' && (
              <p className="text-xs font-semibold text-muted-foreground text-center">
                Demo cook: rose@shc.local / cooksecret — tour opens right after login.
                New kitchens: create account on the cook mobile app, then open this PWA.
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center">Demo: rose@shc.local / cooksecret</p>
          </div>
        </GourmeatCard>
      </div>
    );
  }

  // Authenticated but still checking / redirecting to onboarding
  if (!onboardingReady || (needsOnboarding && !isOnboardingPath)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Preparing kitchen setup…
      </div>
    );
  }

  return <>{children}</>;
}
