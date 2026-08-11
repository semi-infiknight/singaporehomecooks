import '../lib/devtools-guard';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SHCTrayProvider } from '@shc/ui';
import { useSHCFonts } from '@shc/ui/fonts';
import { shcColors } from '@shc/ui/theme';
import ErrorBoundary from '../components/ErrorBoundary';

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
        <SHCTrayProvider queryClient={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(shared)/auth/index" />
            <Stack.Screen name="(shared)/onboarding/index" />
            <Stack.Screen name="(shared)/chat/[orderId]/index" />
          </Stack>
        </SHCTrayProvider>
      </ErrorBoundary>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
