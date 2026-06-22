import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { isAuthenticated } from '../lib/api-client';
import { useAuth } from './useAuth';

export function useGuestAuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const requireAuth = useCallback(
    (message = 'Sign in to add to cart, checkout, and track orders.') => {
      if (loading) return false;
      if (user || isAuthenticated()) return true;
      Alert.alert('Sign in to order', message, [
        { text: 'Keep browsing', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/(shared)/auth' as any) },
      ]);
      return false;
    },
    [user, loading, router]
  );

  return { isGuest: !user && !isAuthenticated(), requireAuth };
}