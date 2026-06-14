import { Redirect } from 'expo-router';

// Root / redirects to the canonical (customer) discovery route per 10-mobile.md structure.
// The full rich discover (with calorie traffic, occasions, seeds, shc-ui) lives in (customer)/index.tsx
// This keeps routes clean for Expo Router groups + blueprint listed paths.
export default function RootIndex() {
  return <Redirect href="/(customer)" />;
}