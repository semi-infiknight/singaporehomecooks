import { createElement, useEffect, useState, type ReactElement } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { hasSeenOnboarding } from '../lib/onboarding';
import { shcColors } from '@shc/ui/theme';

/**
 * First open → warm onboarding carousel (HomelyEats).
 * After guest/skip/sign-in we mark seen and land on Discover.
 * Signed-in users skip straight to marketplace.
 */
export default function RootIndex(): ReactElement {
  const { loading, isAuthenticated } = useAuth();
  const [gate, setGate] = useState<'loading' | 'onboarding' | 'home'>('loading');

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      if (isAuthenticated) {
        if (!cancelled) setGate('home');
        return;
      }
      const seen = await hasSeenOnboarding();
      if (!cancelled) setGate(seen ? 'home' : 'onboarding');
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, isAuthenticated]);

  if (loading || gate === 'loading') {
    return createElement(
      View,
      { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: shcColors.background } },
      createElement(ActivityIndicator, { color: shcColors.primary })
    );
  }

  if (gate === 'onboarding') {
    return <Redirect href="/(shared)/onboarding" />;
  }

  return <Redirect href="/(customer)" />;
}
