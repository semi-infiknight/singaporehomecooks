import { Redis } from "ioredis";

const DEMO_OTP = "123456";
const TTL_SEC = 60 * 15;
const KEY_PREFIX = "shc:cook:register:otp:";

type PendingOtp = { code: string; expiresAt: number };

const memory = new Map<string, PendingOtp>();

let redis: Redis | null | undefined;

async function getRedis(): Promise<Redis | null> {
  if (redis !== undefined) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    redis = null;
    return null;
  }
  try {
    const client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    await client.connect();
    redis = client;
    return redis;
  } catch {
    redis = null;
    return null;
  }
}

function otpKey(email: string) {
  return `${KEY_PREFIX}${email.toLowerCase().trim()}`;
}

function generateOtp(): string {
  return process.env.SHC_COOK_REGISTER_DEMO_OTP?.trim() || DEMO_OTP;
}

/** Issue a registration email OTP (unauthenticated — before account exists). */
export async function issueCookRegisterEmailOtp(email: string): Promise<{ code: string; hint: string }> {
  const normalized = email.toLowerCase().trim();
  const code = generateOtp();
  const r = await getRedis();
  if (r) {
    await r.setex(otpKey(normalized), TTL_SEC, code);
  } else {
    memory.set(normalized, { code, expiresAt: Date.now() + TTL_SEC * 1000 });
  }
  return {
    code,
    hint: `Enter code ${code} to verify (demo)`,
  };
}

/** Verify registration OTP; returns true when valid. */
export async function verifyCookRegisterEmailOtp(email: string, code: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const trimmed = code.trim();
  const r = await getRedis();
  if (r) {
    const stored = await r.get(otpKey(normalized));
    return Boolean(stored && stored === trimmed);
  }
  const pending = memory.get(normalized);
  if (!pending) return false;
  if (pending.expiresAt < Date.now()) {
    memory.delete(normalized);
    return false;
  }
  return pending.code === trimmed;
}

/** Clear OTP after successful registration. */
export async function clearCookRegisterEmailOtp(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const r = await getRedis();
  if (r) {
    await r.del(otpKey(normalized));
    return;
  }
  memory.delete(normalized);
}
