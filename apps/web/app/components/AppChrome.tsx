'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
import { hasSeenOnboarding } from '../../lib/onboarding';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { AppMobileTabBar } from './AppMobileTabBar';
import { CookMobileTabBar } from './CookMobileTabBar';
import { DirectionalTabShell } from './DirectionalTabShell';

/** Paths that must not bounce into first-run onboarding. */
const SKIP_ONBOARDING_PREFIXES = [
  '/onboarding',
  '/login',
  '/cook-portal',
  '/ops',
  '/dev',
  '/sw.js',
  '/content',
];

/**
 * New visitors landing on home → HomelyEats carousel (not sign-in wall).
 * Completing guest/sign-in marks `shc_onboarding_seen_v1` in localStorage.
 */
function FirstVisitOnboardingGate() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (SKIP_ONBOARDING_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    // Only gate marketplace entry (home) so deep links stay shareable
    if (pathname !== '/') return;
    if (hasSeenOnboarding()) return;
    router.replace('/onboarding');
  }, [loading, user, pathname, router]);

  return null;
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isCookPortal = pathname.startsWith('/cook-portal');
  const isOnboarding = pathname === '/onboarding' || pathname.startsWith('/onboarding/');

  if (isCookPortal) {
    const isCookOnboarding = pathname.startsWith('/cook-portal/onboarding');
    if (isCookOnboarding) {
      return (
        <main className="flex-1 w-full bg-background" data-testid="cook-onboarding-chrome">
          {children}
        </main>
      );
    }
    return (
      <>
        <main className="flex-1 w-full pb-[100px] bg-background md:pb-0">
          <DirectionalTabShell mode="cook">{children}</DirectionalTabShell>
        </main>
        <CookMobileTabBar />
      </>
    );
  }

  // Full-bleed carousel — hide chrome so first impression is the tour
  if (isOnboarding) {
    return (
      <>
        <FirstVisitOnboardingGate />
        <main className="flex-1 w-full">{children}</main>
      </>
    );
  }

  return (
    <>
      <FirstVisitOnboardingGate />
      <div className="hidden md:block">
        <AppHeader />
      </div>
      <main className="flex-1 w-full pb-[110px] md:pb-0">
        <DirectionalTabShell mode="customer">{children}</DirectionalTabShell>
      </main>
      <div className="hidden md:block">
        <AppFooter />
      </div>
      <AppMobileTabBar />
    </>
  );
}