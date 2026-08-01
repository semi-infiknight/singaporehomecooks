import { Stack } from 'expo-router';

/** Home dashboard + custom request subpages (keeps tab bar visible). */
export default function CookDashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="requests" />
    </Stack>
  );
}
