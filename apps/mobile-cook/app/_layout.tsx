import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { shcColors } from '@shc/ui';
import ErrorBoundary from '../components/ErrorBoundary';

const shcTheme = {
  tokens: {
    colors: {
      primary: shcColors.primary,
      accent: shcColors.accent,
      background: shcColors.background,
    },
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={shcTheme}>
        <StatusBar style="dark" />
        <ErrorBoundary>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: shcColors.primary },
              headerTintColor: shcColors.background,
              headerTitleStyle: { fontWeight: '600' },
              headerTitle: 'SHC — Cook',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(cook)" options={{ headerShown: false }} />
            <Stack.Screen name="(shared)/auth/index" options={{ title: 'Cook sign in' }} />
            <Stack.Screen name="(shared)/onboarding/index" options={{ title: 'Welcome' }} />
            <Stack.Screen name="(shared)/chat/[orderId]/index" options={{ title: 'Order Chat' }} />
          </Stack>
        </ErrorBoundary>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}