import { createSHCError } from '@shc/types';
import { assertProductionEmailAllowed, validateShcPassword } from '@shc/utils';

export function validateAuthPassword(password: string) {
  const result = validateShcPassword(password);
  if (!result.ok) {
    return { error: createSHCError('SHC-GENERIC-001', result.message) };
  }
  return null;
}

export function validateAuthRegistration(email: string, password: string) {
  const emailCheck = assertProductionEmailAllowed(email);
  if (!emailCheck.ok) {
    return { error: createSHCError('SHC-GENERIC-001', emailCheck.message) };
  }
  return validateAuthPassword(password);
}
