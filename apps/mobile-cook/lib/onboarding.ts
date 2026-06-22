import * as SecureStore from 'expo-secure-store';

export const COOK_ONBOARDING_SEEN_KEY = 'shc_cook_onboarding_seen';

export async function hasSeenCookOnboarding(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(COOK_ONBOARDING_SEEN_KEY);
  return value === 'true';
}

export async function markCookOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(COOK_ONBOARDING_SEEN_KEY, 'true');
}