import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { hasSeenCookOnboarding } from '../lib/onboarding';

export type CookSessionGateState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'needs_onboarding'; user: NonNullable<ReturnType<typeof useAuth>['user']> }
  | { status: 'ready'; user: NonNullable<ReturnType<typeof useAuth>['user']> };

/** Single source of truth: cook must be signed in + onboarded before (cook) routes. */
export function useCookSessionGate(): CookSessionGateState {
  const { user, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setOnboardingChecked(true);
      setNeedsOnboarding(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
      const seen = maestroE2e || (await hasSeenCookOnboarding());
      if (cancelled) return;
      setNeedsOnboarding(!seen);
      setOnboardingChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (loading || (user && !onboardingChecked)) {
    return { status: 'loading' };
  }
  if (!user) {
    return { status: 'unauthenticated' };
  }
  if (needsOnboarding) {
    return { status: 'needs_onboarding', user };
  }
  return { status: 'ready', user };
}
