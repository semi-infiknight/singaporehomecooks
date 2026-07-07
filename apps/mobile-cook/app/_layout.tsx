import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SHCTrayProvider } from '@shc/ui';
import { shcColors } from '@shc/ui/theme';
import { useShcI18n, getCookLayoutCopy } from '@shc/i18n';
import ErrorBoundary from '../components/ErrorBoundary';
import { MobileI18nProvider } from '../lib/i18n-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function CookNavigator() {
  const { locale } = useShcI18n();
  const layout = getCookLayoutCopy(locale);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: shcColors.primary },
        headerTintColor: shcColors.background,
        headerTitleStyle: { fontWeight: '600' },
        headerTitle: layout.appTitle,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(cook)" options={{ headerShown: false }} />
      <Stack.Screen name="(shared)/auth/index" options={{ title: layout.signIn }} />
      <Stack.Screen name="(shared)/onboarding/index" options={{ title: layout.onboardingTitle }} />
      <Stack.Screen name="(shared)/chat/[orderId]/index" options={{ title: layout.orderChat }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <ErrorBoundary>
            <MobileI18nProvider>
              <SHCTrayProvider queryClient={queryClient}>
                <CookNavigator />
              </SHCTrayProvider>
            </MobileI18nProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
