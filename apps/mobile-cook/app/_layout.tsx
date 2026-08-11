import '../lib/devtools-guard';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SHCTrayProvider } from '@shc/ui';
import { useSHCFonts } from '@shc/ui/fonts';
import { shcColors } from '@shc/ui/theme';
import ErrorBoundary from '../components/ErrorBoundary';
import { CookSessionEnforcer } from '../components/CookSessionEnforcer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function AppShell() {
  const fontsLoaded = useSHCFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: shcColors.background }}>
        <ActivityIndicator color={shcColors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <CookSessionEnforcer>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(cook)" />
            <Stack.Screen name="(shared)/auth/index" />
            <Stack.Screen name="(shared)/onboarding/index" />
            <Stack.Screen name="(shared)/chat/[orderId]/index" />
          </Stack>
        </CookSessionEnforcer>
      </ErrorBoundary>
    </>
  );
}

/**
 * Provider order matters:
 * SafeArea → Query → Tray (outer) → ErrorBoundary (inner) → Stack
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SHCTrayProvider queryClient={queryClient}>
            <AppShell />
          </SHCTrayProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
