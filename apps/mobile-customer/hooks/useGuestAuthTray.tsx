import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SHCTrayAction, useSHCTray } from '@shc/ui';

export function useGuestAuthTray() {
  const { openTray, dismiss } = useSHCTray();
  const router = useRouter();

  const showGuestAuthTray = useCallback(
    (title: string, message: string) => {
      openTray(
        { id: 'guest-auth', title, height: 'compact' },
        <SHCTrayAction
          message={message}
          primaryLabel="Sign in"
          onPrimary={() => {
            dismiss();
            router.push('/(shared)/auth' as any);
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