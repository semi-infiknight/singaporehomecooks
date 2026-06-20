import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { shcColors } from '@shc/ui';
import ErrorBoundary from '../components/ErrorBoundary';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
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
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}