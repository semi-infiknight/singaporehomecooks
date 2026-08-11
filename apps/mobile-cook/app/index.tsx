import { Redirect } from 'expo-router';

/** Cold start when session is ready — Stack.Protected in root _layout gates all other states. */
export default function RootIndex() {
  return <Redirect href="/(cook)/dashboard" />;
}
