import { Stack } from 'expo-router';

export default function CookLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: 'Cook Dashboard' }} />
      <Stack.Screen name="listings" options={{ title: 'My Listings & Wizard' }} />
      <Stack.Screen name="orders" options={{ title: 'Cook Orders' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'Manage Order' }} />
      <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
      <Stack.Screen name="compliance/index" options={{ title: 'Compliance' }} />
    </Stack>
  );
}
