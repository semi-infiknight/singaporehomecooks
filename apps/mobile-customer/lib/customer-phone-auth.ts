import { COOK_ONBOARDING_DEMO_OTP, normalizePaynowMobile } from '@shc/utils';

/** Internal password for phone-only customer accounts (not shown in UI). */
export const CUSTOMER_PHONE_AUTH_PASSWORD = 'ShcCust1!';

export function customerPhoneSyntheticEmail(mobile: string): string {
  const normalized = normalizePaynowMobile(mobile);
  const digits = (normalized || mobile).replace(/\D/g, '');
  return `wa.${digits}@customer.shc.local`;
}

export function isValidSgMobileInput(mobile: string): boolean {
  const digits = mobile.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 12;
}

export function formatMobileInput(raw: string): string {
  return raw.replace(/[^\d\s]/g, '').slice(0, 12);
}

export function isDemoWhatsappOtp(otp: string): boolean {
  return otp.trim() === COOK_ONBOARDING_DEMO_OTP;
}
