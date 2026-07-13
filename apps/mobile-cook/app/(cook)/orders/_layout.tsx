import { Stack } from 'expo-router';

/**
 * Nested stack: list (index) + detail ([id]).
 * Avoids Expo Router conflict of orders.tsx + orders/ folder (unmatched route on Details).
 */
export default function CookOrdersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* In-screen header only — native stack header + tray context has been flaky */}
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
