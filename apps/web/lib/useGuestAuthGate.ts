'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { isAuthenticated } from './api-client';
import { useAuth } from './useAuth';
import { useGuestAuthTray } from './useGuestAuthTray';

export function useGuestAuthGate() {
  const { user, loading } = useAuth();
  const { showGuestAuthTray } = useGuestAuthTray();
  const pathname = usePathname();

  const requireAuth = useCallback(
    (message = 'Sign in to add to cart, checkout, and track orders.', returnTo?: string) => {
      if (loading) return false;
      if (user || isAuthenticated()) return true;
      showGuestAuthTray('Sign in to order', message, returnTo || pathname || '/');
      return false;
    },
    [loading, pathname, showGuestAuthTray, user]
  );

  return { isGuest: !loading && !user && !isAuthenticated(), requireAuth };
}
