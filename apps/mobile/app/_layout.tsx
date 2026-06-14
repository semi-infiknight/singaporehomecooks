import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
// config from gluestack optional (theme tokens centralized in @shc/ui now)
import { Slot, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, Pressable } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { shcColors } from '@shc/ui';
import ErrorBoundary from '../components/ErrorBoundary';

// Use centralized theme tokens from shc-ui (12-shared-components)
const shcTheme = {
  tokens: {
    colors: {
      primary: shcColors.primary,
      accent: shcColors.accent,
      background: shcColors.background,
    },
  },
};

function DevRoleSwitcher() {
  const { user, switchRole } = useAuth();
  const router = useRouter();

  const switchTo = async (role: 'customer' | 'cook') => {
    await switchRole(role, role === 'cook' ? 'Auntie Rose' : undefined);
    // Smooth role switch: auto-nav to default screen for journey testing (no app exit)
    if (role === 'customer') {
      router.replace('/' as any); // discover
    } else {
      router.replace('/(cook)/dashboard' as any);
    }
  };

  return (
    <View style={{ flexDirection: 'row', padding: 4, backgroundColor: shcColors.surface, justifyContent: 'flex-end', alignItems: 'center' }}>
      <Text style={{ fontSize: 10, color: shcColors.textLight, marginRight: 6 }}>DEV SWITCH (test full E2E):</Text>
      <Pressable onPress={() => switchTo('customer')} style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: user.role === 'customer' ? shcColors.primary : '#eee', borderRadius: 4 }}>
        <Text style={{ fontSize: 10, color: user.role === 'customer' ? '#fff' : shcColors.text }}>Customer</Text>
      </Pressable>
      <Pressable onPress={() => switchTo('cook')} style={{ paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4, backgroundColor: user.role === 'cook' ? shcColors.primary : '#eee', borderRadius: 4 }}>
        <Text style={{ fontSize: 10, color: user.role === 'cook' ? '#fff' : shcColors.text }}>Cook (Auntie Rose)</Text>
      </Pressable>
      <Text style={{ fontSize: 9, color: shcColors.textLight, marginLeft: 8 }}>Rules + seeds live • one-cook enforced</Text>
    </View>
  );
}

export default function RootLayout() {
  const { user, loading } = useAuth();

  // Observability stub: perf mark on layout mount (for later full tracing)
  if (typeof performance !== 'undefined' && (performance as any).mark) {
    (performance as any).mark('shc_root_layout_mount');
  }

  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={shcTheme}>
        <StatusBar style="dark" />
        <DevRoleSwitcher />
        <ErrorBoundary>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: shcColors.primary },
              headerTintColor: shcColors.background,
              headerTitleStyle: { fontWeight: '600' },
              headerTitle: 'Singapore Home Cooks',
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Discover' }} />
            <Stack.Screen name="(customer)/cart" options={{ title: 'Cart' }} />
            <Stack.Screen name="(customer)/checkout" options={{ title: 'Checkout (PayNow)' }} />
            <Stack.Screen name="(customer)/cook/[slug]" options={{ title: 'Cook Profile' }} />
            <Stack.Screen name="(customer)/product/[id]" options={{ title: 'Dish Detail' }} />
            <Stack.Screen name="(customer)/orders/[id]" options={{ title: 'Track Order' }} />
            <Stack.Screen name="(cook)/dashboard" options={{ title: 'Cook Dashboard' }} />
            <Stack.Screen name="(shared)/chat/[orderId]" options={{ title: 'Order Chat' }} />
          </Stack>
          <Slot />
        </ErrorBoundary>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
