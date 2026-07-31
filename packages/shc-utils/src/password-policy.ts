const WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  '123456',
  '12345678',
  'customersecret',
  'cooksecret',
  'supersecret',
]);

export type PasswordPolicyResult = { ok: true } | { ok: false; message: string };

export type PasswordPolicyOptions = {
  /** When true, enforce 8+ chars, letter + number, block weak/demo passwords. */
  strict?: boolean;
};

export function isStrictPasswordPolicy(opts?: PasswordPolicyOptions): boolean {
  if (opts?.strict != null) return opts.strict;
  if (typeof process !== 'undefined' && process.env?.SHC_STRICT_PASSWORD === '0') return false;
  if (typeof process !== 'undefined' && process.env?.SHC_STRICT_PASSWORD === '1') return true;
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
}

/** Shared password rules for customer + cook sign-up (and password changes). */
export function validateShcPassword(password: string, opts?: PasswordPolicyOptions): PasswordPolicyResult {
  const strict = isStrictPasswordPolicy(opts);
  const minLen = strict ? 8 : 6;
  if (!password || password.length < minLen) {
    return {
      ok: false,
      message: strict
        ? 'Password must be at least 8 characters.'
        : 'Password must be at least 6 characters.',
    };
  }

  if (strict) {
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { ok: false, message: 'Password must include at least one letter and one number.' };
    }
    if (WEAK_PASSWORDS.has(password.toLowerCase())) {
      return { ok: false, message: 'Choose a stronger password — avoid common demo passwords.' };
    }
  }

  return { ok: true };
}

/** Block seed/demo email domains on production registration unless explicitly allowed. */
export function assertProductionEmailAllowed(email: string): PasswordPolicyResult {
  if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') return { ok: true };
  if (process.env.SHC_ALLOW_DEMO_EMAILS === '1') return { ok: true };
  const lower = email.trim().toLowerCase();
  if (lower.endsWith('@shc.local')) {
    return {
      ok: false,
      message: 'Demo email addresses cannot be used for new accounts in production.',
    };
  }
  return { ok: true };
}
