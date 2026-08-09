import * as SecureStore from 'expo-secure-store';

const KEY = 'shc_cook_signup_mobile';

/** Persist WhatsApp number from phone auth — onboarding reads this before profile API catches up. */
export async function saveCookSignupMobile(mobile: string): Promise<void> {
  const digits = mobile.replace(/\D/g, '').slice(-8);
  if (digits.length < 8) return;
  try {
    await SecureStore.setItemAsync(KEY, digits);
  } catch {
    /* ignore */
  }
}

export async function loadCookSignupMobile(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}
