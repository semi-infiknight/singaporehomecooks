import { createElement, type ReactElement } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { shcColors } from '@shc/ui/theme';
import { useCookSessionGate } from '../hooks/useCookSessionGate';

/** Cold start only — session rules live in CookSessionEnforcer at root _layout. */
export default function RootIndex(): ReactElement {
  const gate = useCookSessionGate();

  if (gate.status === 'loading') {
    return createElement(
      View,
      { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: shcColors.background } },
      createElement(ActivityIndicator, { color: shcColors.primary })
    );
  }

  if (gate.status === 'unauthenticated') {
    return <Redirect href="/(shared)/auth" />;
  }

  if (gate.status === 'needs_onboarding') {
    return <Redirect href="/(shared)/onboarding" />;
  }

  return <Redirect href="/(cook)/dashboard" />;
}
