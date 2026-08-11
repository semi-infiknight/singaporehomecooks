'use client';

import { useCallback } from 'react';
import { isAuthenticated } from './api-client';
import { useAuth } from './useAuth';

/**
 * Guest checkout is first-class: cart / checkout / orders work without account.
 * Phone + contact captured at checkout and stored locally + on the order.
 */
export function useGuestAuthGate() {
  const { user, loading } = useAuth();

  const requireAuth = useCallback((_message?: string, _returnTo?: string) => true, []);

  return {
    isGuest: !loading && !user && !isAuthenticated(),
    requireAuth,
  };
}
