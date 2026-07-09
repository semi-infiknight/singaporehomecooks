/** First-run HomelyEats carousel — shared key with mobile customer app. */
export const ONBOARDING_SEEN_KEY = 'shc_onboarding_seen_v1';

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
