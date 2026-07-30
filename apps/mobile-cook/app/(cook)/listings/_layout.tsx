import { Stack } from 'expo-router';

/** List (index) + new listing wizard + edit by id — keeps tab bar visible. */
export default function CookListingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
