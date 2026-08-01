import * as SecureStore from 'expo-secure-store';
import type { CookOnboardingDraft, CookOnboardingStepId } from '@shc/utils';

/** Cook onboarding v2 — full kitchen setup wizard. */
export const COOK_ONBOARDING_SEEN_KEY = 'shc_cook_onboarding_seen_v2';
export const COOK_ONBOARDING_DRAFT_KEY = 'shc_cook_onboarding_draft_v2';
const LEGACY_COOK_ONBOARDING_SEEN_KEY = 'shc_cook_onboarding_seen';

export type SavedCookOnboardingState = {
  stepId: CookOnboardingStepId;
  draft: CookOnboardingDraft;
};

export async function loadCookOnboardingDraft(): Promise<SavedCookOnboardingState | null> {
  try {
    const raw = await SecureStore.getItemAsync(COOK_ONBOARDING_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedCookOnboardingState;
  } catch {
    return null;
  }
}

export async function saveCookOnboardingDraft(state: SavedCookOnboardingState): Promise<void> {
  try {
    await SecureStore.setItemAsync(COOK_ONBOARDING_DRAFT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export async function clearCookOnboardingDraft(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(COOK_ONBOARDING_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export async function hasSeenCookOnboarding(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(COOK_ONBOARDING_SEEN_KEY);
  if (value === '1' || value === 'true') return true;
  const legacyV1 = await SecureStore.getItemAsync('shc_cook_onboarding_seen_v1');
  if (legacyV1 === '1' || legacyV1 === 'true') return true;
  const legacy = await SecureStore.getItemAsync(LEGACY_COOK_ONBOARDING_SEEN_KEY);
  return legacy === 'true' || legacy === '1';
}

export async function markCookOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(COOK_ONBOARDING_SEEN_KEY, '1');
  await clearCookOnboardingDraft();
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