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
import { gourmeatColors } from '@shc/ui/theme';
import { useShcI18n, getCustomerLayoutCopy } from '@shc/i18n';
import ErrorBoundary from '../components/ErrorBoundary';
import { MobileI18nProvider } from '../lib/i18n-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function CustomerNavigator() {
  const { locale } = useShcI18n();
  const layout = getCustomerLayoutCopy(locale);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: gourmeatColors.nav },
        headerTintColor: gourmeatColors.onDark,
        headerTitleStyle: { fontWeight: '700', color: gourmeatColors.onDark },
        headerTitle: layout.appTitle,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(customer)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(shared)/auth/index"
        options={{
          title: layout.signIn,
          headerStyle: { backgroundColor: gourmeatColors.nav },
          headerTintColor: gourmeatColors.onDark,
          headerTitleStyle: { fontWeight: '800', color: gourmeatColors.onDark },
        }}
      />
      <Stack.Screen name="(shared)/onboarding/index" options={{ title: layout.trustSafety }} />
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
                <CustomerNavigator />
              </SHCTrayProvider>
            </MobileI18nProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
