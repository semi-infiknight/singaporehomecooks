import * as SecureStore from 'expo-secure-store';

/** Align with web cook PWA key shape; also accept legacy 'true' value. */
export const COOK_ONBOARDING_SEEN_KEY = 'shc_cook_onboarding_seen_v1';
const LEGACY_COOK_ONBOARDING_SEEN_KEY = 'shc_cook_onboarding_seen';

export async function hasSeenCookOnboarding(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(COOK_ONBOARDING_SEEN_KEY);
  if (value === '1' || value === 'true') return true;
  const legacy = await SecureStore.getItemAsync(LEGACY_COOK_ONBOARDING_SEEN_KEY);
  return legacy === 'true' || legacy === '1';
}

export async function markCookOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(COOK_ONBOARDING_SEEN_KEY, '1');
  try {
    await SecureStore.deleteItemAsync(LEGACY_COOK_ONBOARDING_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function clearCookOnboardingSeen(): Promise<void> {
  await SecureStore.deleteItemAsync(COOK_ONBOARDING_SEEN_KEY);
  try {
    await SecureStore.deleteItemAsync(LEGACY_COOK_ONBOARDING_SEEN_KEY);
  } catch {
    /* ignore */
  }
}