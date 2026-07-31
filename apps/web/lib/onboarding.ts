/** First-run HomelyEats carousel — customer PWA / mobile. */
import type { CookOnboardingDraft, CookOnboardingStepId } from '@shc/utils';

export const ONBOARDING_SEEN_KEY = 'shc_onboarding_seen_v1';

/** Cook portal onboarding v2 — full kitchen setup wizard. */
export const COOK_ONBOARDING_SEEN_KEY = 'shc_cook_onboarding_seen_v2';
export const COOK_ONBOARDING_DRAFT_KEY = 'shc_cook_onboarding_draft_v2';

export type SavedCookOnboardingState = {
  stepId: CookOnboardingStepId;
  draft: CookOnboardingDraft;
};

export function loadCookOnboardingDraft(): SavedCookOnboardingState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOK_ONBOARDING_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedCookOnboardingState;
  } catch {
    return null;
  }
}

export function saveCookOnboardingDraft(state: SavedCookOnboardingState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COOK_ONBOARDING_DRAFT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function clearCookOnboardingDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(COOK_ONBOARDING_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function hasSeenCookOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (localStorage.getItem(COOK_ONBOARDING_SEEN_KEY) === '1') return true;
    return localStorage.getItem('shc_cook_onboarding_seen_v1') === '1';
  } catch {
    return false;
  }
}

export function markCookOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COOK_ONBOARDING_SEEN_KEY, '1');
    clearCookOnboardingDraft();
  } catch {
    /* ignore */
  }
}

export function clearCookOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(COOK_ONBOARDING_SEEN_KEY);
  } catch {
    /* ignore */
  }
}
