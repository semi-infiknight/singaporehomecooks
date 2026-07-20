'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SHCTrayActionWeb, useSHCTrayWeb } from '../app/components/SHCWebComponents';

export function useGuestAuthTray() {
  const { openTray, dismiss } = useSHCTrayWeb();
  const router = useRouter();

  const showGuestAuthTray = useCallback(
    (title: string, message: string, returnTo?: string) => {
      const next = returnTo?.startsWith('/') ? returnTo : '/';
      openTray(
        { id: 'guest-auth', title, height: 'compact' },
        <SHCTrayActionWeb
          message={message}
          primaryLabel="Sign in"
          onPrimary={() => {
            dismiss();
            router.push(`/login?next=${encodeURIComponent(next)}`);
          }}
          secondaryLabel="Keep browsing"
          onSecondary={dismiss}
          testID="guest-auth-tray"
        />
      );
    },
    [dismiss, openTray, router]
  );

  return { showGuestAuthTray };
}
