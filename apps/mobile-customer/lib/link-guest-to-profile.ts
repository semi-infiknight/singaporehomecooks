/**
 * After phone login, merge device-local guest data into the customer profile.
 * Addresses stay on-device; name/phone from guest checkout prefill profile when empty.
 */
import * as SecureStore from 'expo-secure-store';
import { readGuestContact } from './guest-session';

const PROFILE_NAME_KEY = 'shc_customer_display_name_v1';
const PROFILE_PHOTO_KEY = 'shc_customer_pickup_photo_v1';
const PROFILE_PHONE_KEY = 'shc_customer_phone_v1';
const PROFILE_ONBOARDING_KEY = 'shc_customer_profile_onboarding_v1';

export async function saveCustomerDisplayName(name: string): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_NAME_KEY, name.trim());
}

export async function readCustomerDisplayName(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(PROFILE_NAME_KEY))?.trim() || null;
  } catch {
    return null;
  }
}

export async function saveCustomerPickupPhoto(uri: string): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_PHOTO_KEY, uri);
}

export async function readCustomerPickupPhoto(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(PROFILE_PHOTO_KEY))?.trim() || null;
  } catch {
    return null;
  }
}

export async function saveCustomerPhone(mobile: string): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_PHONE_KEY, mobile.trim());
}

export async function readCustomerPhone(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(PROFILE_PHONE_KEY))?.trim() || null;
  } catch {
    return null;
  }
}

export async function hasCompletedProfileOnboarding(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(PROFILE_ONBOARDING_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markProfileOnboardingDone(): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_ONBOARDING_KEY, '1');
}

/** Pull guest checkout name into local profile if we don't have one yet. */
export async function linkGuestLocalDataToProfile(phone?: string): Promise<{
  needsName: boolean;
  hasGuestName: boolean;
}> {
  if (phone?.trim()) await saveCustomerPhone(phone.trim());

  const existingName = await readCustomerDisplayName();
  const guest = await readGuestContact();
  if (!existingName && guest?.name?.trim()) {
    await saveCustomerDisplayName(guest.name.trim());
  }
  if (guest?.phone?.trim() && !(await readCustomerPhone())) {
    await saveCustomerPhone(guest.phone.trim());
  }

  const name = await readCustomerDisplayName();
  return {
    needsName: !name,
    hasGuestName: Boolean(guest?.name?.trim()),
  };
}
