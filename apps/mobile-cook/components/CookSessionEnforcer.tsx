import React, { type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, useSegments } from 'expo-router';
import { shcColors } from '@shc/ui/theme';
import { useCookSessionGate } from '../hooks/useCookSessionGate';

function LoadingShell() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: shcColors.background }}>
      <ActivityIndicator color={shcColors.primary} />
    </View>
  );
}

/**
 * Root navigation guard — not a "visual" banner. Any route outside auth/onboarding
 * requires a cook session. Deep links (shc-cook:///(cook)/orders) hit here, not index.tsx.
 */
export function CookSessionEnforcer({ children }: { children: ReactNode }) {
  const gate = useCookSessionGate();
  const segments = useSegments();

  const parts = segments as string[];
  const group = parts[0];
  const screen = parts[1];
  const isAuth = group === '(shared)' && screen === 'auth';
  const isOnboarding = group === '(shared)' && screen === 'onboarding';
  const isProtected =
    group === '(cook)' || (group === '(shared)' && screen === 'chat');

  if (gate.status === 'loading') {
    return <LoadingShell />;
  }

  if (gate.status === 'unauthenticated') {
    if (isAuth) return <>{children}</>;
    return <Redirect href="/(shared)/auth" />;
  }

  if (gate.status === 'needs_onboarding') {
    if (isOnboarding) return <>{children}</>;
    return <Redirect href="/(shared)/onboarding" />;
  }

  // Signed in + onboarded — keep auth/onboarding out of the main app
  if (isAuth || isOnboarding) {
    return <Redirect href="/(cook)/dashboard" />;
  }

  if (isProtected || group === 'index' || !group) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
