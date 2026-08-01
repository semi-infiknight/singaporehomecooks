import { createElement, type ReactElement } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { shcColors } from '@shc/ui/theme';

/**
 * Land on Discover immediately — no forced onboarding carousel.
 */
export default function RootIndex(): ReactElement {
  const { loading } = useAuth();

  if (loading) {
    return createElement(
      View,
      { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: shcColors.background } },
      createElement(ActivityIndicator, { color: shcColors.primary })
    );
  }

  return <Redirect href="/(customer)" />;
}
