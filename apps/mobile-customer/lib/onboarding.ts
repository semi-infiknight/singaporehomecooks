import * as SecureStore from 'expo-secure-store';

/** Persist first-run carousel completion (guest explore, skip, or sign-in). */
export const ONBOARDING_SEEN_KEY = 'shc_onboarding_seen_v1';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, '1');
  } catch {
    /* ignore storage failures — do not block navigation */
  }
}
