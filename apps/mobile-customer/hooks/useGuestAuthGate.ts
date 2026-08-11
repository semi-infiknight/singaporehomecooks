import { useCallback } from 'react';
import { isAuthenticated } from '../lib/api-client';
import { useAuth } from './useAuth';

/**
 * Guest checkout is first-class: cart, checkout, and order tracking work with a
 * device guest session + phone at checkout. Auth is optional (not a gate).
 */
export function useGuestAuthGate() {
  const { user, loading } = useAuth();

  const requireAuth = useCallback((_message?: string) => {
    // Always allow — guests order without signing in.
    return true;
  }, []);

  return {
    isGuest: !loading && !user && !isAuthenticated(),
    requireAuth,
  };
}