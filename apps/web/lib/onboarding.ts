/** First-run HomelyEats carousel — customer PWA / mobile. */
export const ONBOARDING_SEEN_KEY = 'shc_onboarding_seen_v1';

/** Cook portal onboarding v2 — full kitchen setup wizard. */
export const COOK_ONBOARDING_SEEN_KEY = 'shc_cook_onboarding_seen_v2';

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
